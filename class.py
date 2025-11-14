# def trace(n):
#     print("Entering:", n)
#     if n > 0:
#         trace(n-1)
#     print("Leaving:", n)

# trace(3)

# def fib(n):
#     print("fib called with", n)
#     if n <= 1:
#         return n
#     return fib(n-1) + fib(n-2)
# fib(5)

# Recursive
def sum_to_n(n):
    if n == 0:
        return 0
    return n + sum_to_n(n-1)

sum_to_n(5)

# Iterative
def sum_to_n_iter(n):
    total = 0
    for i in range(1, n+1):
        total += i
    return total

sum_to_n_iter(5)