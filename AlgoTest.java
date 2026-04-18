import java.util.Random;

public class AlgoTest {

    static int[][] graph;
    static int n;

    public static void createGraph(int size) {
        n = size;
        graph = new int[n][n];

        Random rand = new Random();

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {

                if (rand.nextInt(100) < 40) {
                    int weight = rand.nextInt(10) + 1;

                    graph[i][j] = weight;
                    graph[j][i] = weight;
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

        boolean[] visited = new boolean[n];
        int[] queue = new int[n];

        int front = 0;
        int back = 0;

        queue[back++] = start;
        visited[start] = true;

        while (front < back) {
            int curr = queue[front++];

            if (curr == end)
                return 0;

            for (int i = 0; i < n; i++) {
                if (graph[curr][i] != 0 && !visited[i]) {
                    visited[i] = true;
                    queue[back++] = i;
                }
            }
        }

        return -1;
    }

    public static void main(String[] args) {
        for (int size = 100; size <= 5000; size += 100) {

            for (int i = 0; i < 5; i++) {
                Random rand = new Random();

                createGraph(size);

                int start = 0;
                int end = size - 1;

                long dStart = System.nanoTime();
                dijkstra(start, end);
                long dEnd = System.nanoTime();

                long bStart = System.nanoTime();
                bfs(start, end);
                long bEnd = System.nanoTime();

                double dTime = (dEnd - dStart) / 1000000000.0;
                double bTime = (bEnd - bStart) / 1000000000.0;

                System.out.println(size + " " + dTime + " " + bTime);
            }
        }
    }
}