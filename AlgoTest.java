import java.io.*;
import java.util.*;
 
public class AlgoTest {
 
    static int n;
    static String[] vertexLabel;
    static double[] lat, lon;
    static List<int[]>[] adjList;
    static Map<String, Integer> highwayIds = new HashMap<>();
    static int nextHighwayId = 0;
 
    static int[][] graph;
    static String[][] highway;
 
    public static void createGraph(int size) {
        n = size;
        graph = new int[n][n];
        highway = new String[n][n];
        Random rand = new Random();
        String[] highwayNames = {"I-90", "I-80", "US-20", "US-30", "SR-15"};
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (rand.nextInt(100) < 40) {
                    int weight = rand.nextInt(10) + 1;
                    String hw = highwayNames[rand.nextInt(highwayNames.length)];
                    graph[i][j] = weight;
                    graph[j][i] = weight;
                    highway[i][j] = hw;
                    highway[j][i] = hw;
                }
            }
        }
    }
 
    @SuppressWarnings("unchecked")
    public static void loadTMG(String filename) throws IOException {
        BufferedReader br = new BufferedReader(new FileReader(filename));
        String header = br.readLine();
        if (header == null || !header.startsWith("TMG")) {
            br.close();
            throw new IOException("Not a valid TMG file.");
        }
        String[] counts = br.readLine().trim().split("\\s+");
        n = Integer.parseInt(counts[0]);
        int numEdges = Integer.parseInt(counts[1]);
        vertexLabel = new String[n];
        lat = new double[n];
        lon = new double[n];
        adjList = new List[n];
        for (int i = 0; i < n; i++) adjList[i] = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            String[] tok = br.readLine().trim().split("\\s+");
            vertexLabel[i] = tok[0];
            lat[i] = Double.parseDouble(tok[1]);
            lon[i] = Double.parseDouble(tok[2]);
        }
        for (int i = 0; i < numEdges; i++) {
            String[] tok = br.readLine().trim().split("\\s+");
            int v1 = Integer.parseInt(tok[0]);
            int v2 = Integer.parseInt(tok[1]);
            String roadLabel = tok[2];
            double dist = 0;
            double pLat = lat[v1], pLon = lon[v1];
            int shapingPairs = (tok.length - 3) / 2;
            for (int s = 0; s < shapingPairs; s++) {
                double sLat = Double.parseDouble(tok[3 + s * 2]);
                double sLon = Double.parseDouble(tok[4 + s * 2]);
                dist += haversine(pLat, pLon, sLat, sLon);
                pLat = sLat;
                pLon = sLon;
            }
            dist += haversine(pLat, pLon, lat[v2], lon[v2]);
            String hw = roadLabel.contains("_") ? roadLabel.substring(0, roadLabel.indexOf('_')) : roadLabel;
            if (!highwayIds.containsKey(hw)) highwayIds.put(hw, nextHighwayId++);
            int hId = highwayIds.get(hw);
            int distInt = (int)(dist * 1000);
            adjList[v1].add(new int[]{v2, distInt, hId});
            adjList[v2].add(new int[]{v1, distInt, hId});
        }
        br.close();
    }
 
    static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 3958.8;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
 
    public static int dijkstra(int start, int end) {
        int[] dist = new int[n];
        boolean[] visited = new boolean[n];
        for (int i = 0; i < n; i++) dist[i] = Integer.MAX_VALUE;
        dist[start] = 0;
        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int j = 0; j < n; j++) {
                if (!visited[j] && (u == -1 || dist[j] < dist[u])) u = j;
            }
            if (u == -1) break;
            if (dist[u] == Integer.MAX_VALUE) break;
            visited[u] = true;
            for (int v = 0; v < n; v++) {
                if (graph[u][v] != 0) {
                    int newDist = dist[u] + graph[u][v];
                    if (newDist < dist[v]) dist[v] = newDist;
                }
            }
        }
        return dist[end];
    }
 
    public static double dijkstraTMG(int start, int end) {
        double[] dist = new double[n];
        Arrays.fill(dist, Double.MAX_VALUE);
        dist[start] = 0.0;
        PriorityQueue<double[]> pq = new PriorityQueue<>(Comparator.comparingDouble(a -> a[0]));
        pq.offer(new double[]{0.0, start});
        while (!pq.isEmpty()) {
            double[] curr = pq.poll();
            int u = (int) curr[1];
            if (curr[0] > dist[u]) continue;
            if (u == end) return dist[end];
            for (int[] edge : adjList[u]) {
                int v = edge[0];
                double newDist = dist[u] + edge[1];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new double[]{newDist, v});
                }
            }
        }
        return dist[end] == Double.MAX_VALUE ? -1 : dist[end];
    }
 
    public static int bfs(int start, int end) {
        int[] minSwitches = new int[n];
        String[] currentHW = new String[n];
        for (int i = 0; i < n; i++) {
            minSwitches[i] = Integer.MAX_VALUE;
            currentHW[i] = "";
        }
        int[] queue = new int[n * n];
        int front = 0, back = 0;
        queue[back++] = start;
        minSwitches[start] = 0;
        while (front < back) {
            int curr = queue[front++];
            if (curr == end) return minSwitches[end];
            for (int i = 0; i < n; i++) {
                if (graph[curr][i] != 0) {
                    String edgeHW = highway[curr][i];
                    boolean isSwitch = !currentHW[curr].equals("") && !currentHW[curr].equals(edgeHW);
                    int newSwitches = minSwitches[curr] + (isSwitch ? 1 : 0);
                    if (newSwitches < minSwitches[i]) {
                        minSwitches[i] = newSwitches;
                        currentHW[i] = edgeHW;
                        queue[back++] = i;
                    }
                }
            }
        }
        return minSwitches[end] == Integer.MAX_VALUE ? -1 : minSwitches[end];
    }
 
    public static int bfsTMG(int start, int end) {
        int H = nextHighwayId;
        int[][] minSwitches = new int[n][H];
        for (int[] row : minSwitches) Arrays.fill(row, Integer.MAX_VALUE);
        Deque<int[]> dq = new ArrayDeque<>();
        for (int[] edge : adjList[start]) {
            int hId = edge[2];
            if (minSwitches[start][hId] > 0) {
                minSwitches[start][hId] = 0;
                dq.addFirst(new int[]{start, hId, 0});
            }
        }
        while (!dq.isEmpty()) {
            int[] s = dq.pollFirst();
            int vertex = s[0], hId = s[1], switches = s[2];
            if (switches > minSwitches[vertex][hId]) continue;
            if (vertex == end) break;
            for (int[] edge : adjList[vertex]) {
                int nextV = edge[0], nextH = edge[2];
                boolean sameHW = (nextH == hId);
                int newSwitches = switches + (sameHW ? 0 : 1);
                if (newSwitches < minSwitches[nextV][nextH]) {
                    minSwitches[nextV][nextH] = newSwitches;
                    if (sameHW) dq.addFirst(new int[]{nextV, nextH, newSwitches});
                    else dq.addLast(new int[]{nextV, nextH, newSwitches});
                }
            }
        }
        int best = Integer.MAX_VALUE;
        for (int h = 0; h < H; h++) {
            if (minSwitches[end][h] < best) best = minSwitches[end][h];
        }
        return best == Integer.MAX_VALUE ? -1 : best;
    }
 
    public static void main(String[] args) throws IOException {
        if (args.length > 0) {
            loadTMG(args[0]);
            int numPairs = args.length > 1 ? Integer.parseInt(args[1]) : 10;
            Random rand = new Random(42);
 
            System.out.println("pair dijkstra_dist_mi bfs_switches");
 
            for (int i = 0; i < numPairs; i++) {
                int s = rand.nextInt(n);
                int e = rand.nextInt(n);
                while (e == s) e = rand.nextInt(n);
                double dDist = dijkstraTMG(s, e);
                int bSwitches = bfsTMG(s, e);
                System.out.printf("%d %.2f %d%n", i+1, dDist/1000.0, bSwitches);
            }
 
        } else {
            for (int size = 100; size <= 5000; size += 100) {
                for (int i = 0; i < 5; i++) {
                    createGraph(size);
                    int start = 0;
                    int end = size - 1;
                    long dStart = System.nanoTime();
                    int dijkResult = dijkstra(start, end);
                    long dEnd = System.nanoTime();
                    long bStart = System.nanoTime();
                    int bfsResult = bfs(start, end);
                    long bEnd = System.nanoTime();
                    double dTime = (dEnd - dStart) / 1000000000.0;
                    double bTime = (bEnd - bStart) / 1000000000.0;
                    System.out.println(size + " " + dijkResult + " " + bfsResult + " " + dTime + " " + bTime);
                }
            }
        }
    }
}
