n = int(input())
arr = list(map(int, input().split()))

freq = {}

for x in arr:
    freq[x] = freq.get(x, 0) + 1

for x in arr:
    if freq[x] > 1:
        print(x)
        break
else:
    print(-1)