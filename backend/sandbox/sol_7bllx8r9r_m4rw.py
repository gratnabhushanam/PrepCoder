n = int(input())
arr = list(map(int, input().split()))

seen = set()

for x in arr:
    if x in seen:
        print(x)
        break
    seen.add(x)
else:
    print(-1)