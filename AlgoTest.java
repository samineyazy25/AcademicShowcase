import java.util.Random;
public class AlgoTest {
    static int[][] graph;
    static String[][] highway;
    static int n;
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
    public static int dijkstra(int start, int end) {
        int[] dist = new int[n];
        boolean[] visited = new boolean[n];
        for (int i = 0; i < n; i++) {
            dist[i] = Integer.MAX_VALUE;
        }
        dist[start] = 0;
        for (int i = 0; i < n; i++) {
            int u = -1;
            for (int j = 0; j < n; j++) {
                if (!visited[j] && (u == -1 || dist[j] < dist[u])) {
                    u = j;
                }
            }
            if (u == -1)
                break;
            if (dist[u] == Integer.MAX_VALUE)
                break;
            visited[u] = true;
            for (int v = 0; v < n; v++) {
                if (graph[u][v] != 0) {
                    int newDist = dist[u] + graph[u][v];
                    if (newDist < dist[v]) {
                        dist[v] = newDist;
                    }
                }
            }
        }
        return dist[end];
    }
    public static int bfs(int start, int end) {
        int[] minSwitches = new int[n];
        String[] currentHW = new String[n];
        for (int i = 0; i < n; i++) {
            minSwitches[i] = Integer.MAX_VALUE;
            currentHW[i] = "";
        }
        int[] queue = new int[n * n];
        int front = 0;
        int back = 0;
        queue[back++] = start;
        minSwitches[start] = 0;
        while (front < back) {
            int curr = queue[front++];
            if (curr == end)
                return minSwitches[end];
            for (int i = 0; i < n; i++) {
                if (graph[curr][i] != 0) {
                    String edgeHW = highway[curr][i];
                    boolean isSwitch = !currentHW[curr].equals("")
                                    && !currentHW[curr].equals(edgeHW);
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
    public static void main(String[] args) {
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
                System.out.println(size + " dijkDist=" + dijkResult
                        + " bfsSwitches=" + bfsResult
                        + " dijkTime=" + dTime
                        + " bfsTime=" + bTime);
            }
        }
    }
}
 
