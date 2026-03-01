// sample.cs — Theme fixture: C# 10/11/12
//
// Open in Extension Development Host (F5) and use
// "Developer: Inspect Editor Tokens and Scopes" to verify colours.
//
// Key things to check:
//   record / init / with         → teal italic    (#45c6d6)
//   async / await                → teal italic    (#45c6d6)
//   pattern operators (is / not) → teal italic    (#45c6d6)
//   interface / class names      → coral red      (#ff8080)
//   @property attributes         → hot pink       (#ff6aad)
//   primitive types (int, bool)  → dusty mauve    (#d69aa7)

#nullable enable

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace ThemeFixture.CSharp;

// ── Enums ─────────────────────────────────────────────────────────────────────

public enum Severity
{
    Trace   = 0,
    Debug   = 1,
    Info    = 2,
    Warning = 3,
    Error   = 4,
    Fatal   = 5,
}

[Flags]
public enum Permission
{
    None    = 0,
    Read    = 1 << 0,
    Write   = 1 << 1,
    Execute = 1 << 2,
    All     = Read | Write | Execute,
}

// ── Interfaces ────────────────────────────────────────────────────────────────

public interface IEntity<TId>
{
    TId Id { get; }
}

public interface IRepository<T, TId> where T : IEntity<TId>
{
    Task<T?>             FindByIdAsync(TId id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> FindAllAsync(CancellationToken ct = default);
    Task<T>              SaveAsync(T entity, CancellationToken ct = default);
    Task<bool>           DeleteAsync(TId id, CancellationToken ct = default);
}

public interface IValidator<T>
{
    ValidationResult Validate(T value);
}

// ── Records ───────────────────────────────────────────────────────────────────

public record ValidationError(string Field, string Message);

public record ValidationResult
{
    public bool IsValid          { get; init; }
    public ImmutableList<ValidationError> Errors { get; init; } = ImmutableList<ValidationError>.Empty;

    public static ValidationResult Success()
        => new() { IsValid = true };

    public static ValidationResult Failure(params ValidationError[] errors)
        => new() { IsValid = false, Errors = errors.ToImmutableList() };
}

public record struct Point(double X, double Y)
{
    public double DistanceTo(Point other)
    {
        double dx = X - other.X;
        double dy = Y - other.Y;
        return Math.Sqrt(dx * dx + dy * dy);
    }

    public static Point operator +(Point a, Point b) => new(a.X + b.X, a.Y + b.Y);
    public static Point operator -(Point a, Point b) => new(a.X - b.X, a.Y - b.Y);
    public static Point operator *(Point p, double s) => new(p.X * s, p.Y * s);
}

// record with inheritance
public abstract record Shape(string Name)
{
    public abstract double Area    { get; }
    public abstract double Perimeter { get; }
}

public record Circle(double Radius) : Shape("Circle")
{
    public override double Area      => Math.PI * Radius * Radius;
    public override double Perimeter => 2 * Math.PI * Radius;
}

public record Rectangle(double Width, double Height) : Shape("Rectangle")
{
    public override double Area      => Width * Height;
    public override double Perimeter => 2 * (Width + Height);
}

// ── Classes ───────────────────────────────────────────────────────────────────

[DebuggerDisplay("{Name} (id={Id})")]
public sealed class User : IEntity<Guid>
{
    public Guid    Id        { get; init; } = Guid.NewGuid();
    public string  Name      { get; set; }  = string.Empty;
    public string  Email     { get; set; }  = string.Empty;
    public bool    IsActive  { get; set; }  = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    private readonly List<string> _roles = new();
    public IReadOnlyList<string>  Roles => _roles.AsReadOnly();

    public void AddRole(string role)
    {
        ArgumentException.ThrowIfNullOrEmpty(role);
        if (!_roles.Contains(role)) _roles.Add(role);
    }

    public User WithName(string name) => this with { Name = name };

    public override string ToString()
        => $"User {{ Id={Id:D}, Name={Name}, Email={Email} }}";
}

// ── Generic class ─────────────────────────────────────────────────────────────

public sealed class Result<T>
{
    private readonly T?         _value;
    private readonly Exception? _error;

    private Result(T value)       { _value = value; IsOk = true; }
    private Result(Exception err) { _error = err;   IsOk = false; }

    public bool IsOk    { get; }
    public bool IsError => !IsOk;

    public T Value => IsOk
        ? _value!
        : throw new InvalidOperationException("Result is in error state.", _error);

    public Exception Error => IsError
        ? _error!
        : throw new InvalidOperationException("Result is in success state.");

    public static Result<T> Ok(T value)       => new(value);
    public static Result<T> Err(Exception ex) => new(ex);

    public Result<TOut> Map<TOut>(Func<T, TOut> fn)
        => IsOk ? Result<TOut>.Ok(fn(_value!)) : Result<TOut>.Err(_error!);

    public T GetOrDefault(T defaultValue) => IsOk ? _value! : defaultValue;
}

// ── Attributes ────────────────────────────────────────────────────────────────

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class LogAttribute : Attribute
{
    public Severity Level { get; }
    public LogAttribute(Severity level = Severity.Info) => Level = level;
}

[AttributeUsage(AttributeTargets.Property)]
public sealed class RequiredAttribute : Attribute { }

// ── Async / await ─────────────────────────────────────────────────────────────

public static class AsyncHelpers
{
    public static async Task<T> WithRetryAsync<T>(
        Func<Task<T>> operation,
        int           maxAttempts = 3,
        TimeSpan?     delay       = null,
        CancellationToken ct      = default)
    {
        delay ??= TimeSpan.FromMilliseconds(500);
        Exception? lastEx = null;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            try
            {
                return await operation().ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                lastEx = ex;
                if (attempt < maxAttempts - 1)
                    await Task.Delay(delay.Value, ct).ConfigureAwait(false);
            }
        }
        throw new InvalidOperationException($"All {maxAttempts} attempts failed.", lastEx);
    }

    public static async IAsyncEnumerable<T> ToAsyncEnumerable<T>(
        IEnumerable<T> source,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        foreach (var item in source)
        {
            ct.ThrowIfCancellationRequested();
            yield return item;
            await Task.Yield();
        }
    }
}

// ── Pattern matching ──────────────────────────────────────────────────────────

public static class Patterns
{
    public static string DescribeShape(Shape shape) => shape switch
    {
        Circle   { Radius: > 10 }         => "large circle",
        Circle   c                         => $"circle r={c.Radius:F2}",
        Rectangle { Width: var w, Height: var h } when w == h
                                           => $"square {w}x{h}",
        Rectangle r                        => $"rect {r.Width}x{r.Height}",
        _                                  => "unknown shape",
    };

    public static string Classify(object? obj) => obj switch
    {
        null              => "null",
        int n when n < 0  => $"negative int: {n}",
        int n             => $"non-negative int: {n}",
        string { Length: 0 }
                          => "empty string",
        string s          => $"string: \"{s}\"",
        IEnumerable<int> list => $"int list ({list.Count()} items)",
        _                 => obj.GetType().Name,
    };

    // C# 11 list patterns
    public static string DescribeList(int[] nums) => nums switch
    {
        []                  => "empty",
        [var single]        => $"one element: {single}",
        [var first, var last]  => $"two: {first}, {last}",
        [var head, .. var tail] => $"head={head}, {tail.Length} more",
    };

    // is-expression patterns
    public static bool IsValidUser(object? obj)
    {
        if (obj is not User { IsActive: true } user) return false;
        if (user.Name is not { Length: > 0 })        return false;
        if (user.Email is not string { Length: > 3 }) return false;
        return true;
    }
}

// ── LINQ ──────────────────────────────────────────────────────────────────────

public static class LinqExamples
{
    public static IEnumerable<(string Name, int Count)> GroupAndCount(IEnumerable<string> items)
        => items
            .GroupBy(s => s, StringComparer.OrdinalIgnoreCase)
            .Select(g => (Name: g.Key, Count: g.Count()))
            .OrderByDescending(t => t.Count)
            .ThenBy(t => t.Name);

    public static Dictionary<TKey, TValue> ToDictionarySafe<T, TKey, TValue>(
        this IEnumerable<T> source,
        Func<T, TKey>   keySelector,
        Func<T, TValue> valueSelector)
        where TKey : notnull
        => source
            .GroupBy(keySelector)
            .ToDictionary(g => g.Key, g => valueSelector(g.First()));
}

// ── Strings ───────────────────────────────────────────────────────────────────

public static class StringExamples
{
    public static void Showcase()
    {
        string name    = "World";
        int    count   = 42;
        double pi      = Math.PI;

        // String interpolation
        string greeting  = $"Hello, {name}!";
        string formatted = $"count={count:N0}  pi={pi:F4}";
        string padded    = $"{name,10}";

        // Raw string literals (C# 11)
        string raw = """
            SELECT id, name
            FROM   users
            WHERE  active = TRUE
            """;

        // Verbatim
        string path  = @"C:\Users\Public\Documents";
        string regex = @"^\d{4}-\d{2}-\d{2}$";

        // StringBuilder
        var sb = new StringBuilder();
        sb.Append("Hello").Append(", ").AppendLine(name);
        sb.AppendFormat("pi = {0:F2}\n", pi);

        Console.WriteLine(greeting);
        Console.WriteLine(formatted);
        Console.WriteLine(padded);
        Console.WriteLine(raw.Trim());
        Console.WriteLine(sb);
        _ = path; _ = regex;
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

public static class Program
{
    public static async Task Main(string[] args)
    {
        // Records and with-expressions
        var p1 = new Point(1.0, 2.0);
        var p2 = new Point(4.0, 6.0);
        Console.WriteLine($"Distance: {p1.DistanceTo(p2):F4}");

        var circle = new Circle(5.0);
        var bigger = circle with { Radius = 10.0 };
        Console.WriteLine(Patterns.DescribeShape(bigger));

        // Result monad
        var ok  = Result<int>.Ok(42);
        var err = Result<int>.Err(new InvalidOperationException("oops"));
        Console.WriteLine(ok.Map(x => x * 2).Value);
        Console.WriteLine(err.GetOrDefault(-1));

        // Async retry
        int counter = 0;
        int result = await AsyncHelpers.WithRetryAsync(async () =>
        {
            await Task.Yield();
            if (++counter < 3) throw new IOException("transient error");
            return counter;
        }, maxAttempts: 5);
        Console.WriteLine($"Succeeded on attempt {result}");

        // Pattern matching
        var items = new[] { "foo", "bar", "foo", "baz", "bar", "foo" };
        foreach (var (name, count) in LinqExamples.GroupAndCount(items))
            Console.WriteLine($"  {name}: {count}");

        // User
        var user = new User { Name = "Alice", Email = "alice@example.com" };
        user.AddRole("admin");
        var renamed = user.WithName("Alicia");
        Console.WriteLine(renamed);

        StringExamples.Showcase();
    }
}
