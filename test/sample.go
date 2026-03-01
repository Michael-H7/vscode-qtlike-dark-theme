// sample.go — Theme fixture: Go 1.21+
//
// Open in Extension Development Host (F5) and use
// "Developer: Inspect Editor Tokens and Scopes" to verify colours.
//
// Key things to check:
//   package names      → coral red      (#ff8080)
//   := operator        → coral red      (#ff8080)
//   interface names    → coral red      (#ff8080)
//   goroutines / chan  → teal italic    (#45c6d6)
//   string literals    → amber          (#d69545)
//   comments           → cool grey italic (#a8abb0)
// Note: Go semantic tokens require opt-in:
//   "gopls": { "ui.semanticTokens": true }  in settings.json

package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const (
	MaxRetries     = 3
	DefaultTimeout = 30 * time.Second
	Version        = "1.0.0"
	Pi             = math.Pi
)

// ── Enums (iota) ──────────────────────────────────────────────────────────────

type Direction int

const (
	North Direction = iota
	South
	East
	West
)

func (d Direction) String() string {
	return [...]string{"north", "south", "east", "west"}[d]
}

type LogLevel uint8

const (
	Trace LogLevel = iota
	Debug
	Info
	Warning
	Error
	Fatal
)

// ── Interfaces ────────────────────────────────────────────────────────────────

type Stringer interface {
	String() string
}

type Repository[T any, ID comparable] interface {
	FindByID(ctx context.Context, id ID) (T, error)
	FindAll(ctx context.Context) ([]T, error)
	Save(ctx context.Context, entity T) (T, error)
	Delete(ctx context.Context, id ID) error
}

type Validator[T any] interface {
	Validate(value T) error
}

// Embedding interfaces
type ReadWriter interface {
	io.Reader
	io.Writer
}

// ── Structs ───────────────────────────────────────────────────────────────────

type Point struct {
	X, Y float64
}

func NewPoint(x, y float64) Point {
	return Point{X: x, Y: y}
}

func (p Point) Distance(other Point) float64 {
	dx := p.X - other.X
	dy := p.Y - other.Y
	return math.Sqrt(dx*dx + dy*dy)
}

func (p Point) String() string {
	return fmt.Sprintf("(%.2f, %.2f)", p.X, p.Y)
}

func (p *Point) Scale(factor float64) {
	p.X *= factor
	p.Y *= factor
}

type User struct {
	ID        uint64
	Name      string
	Email     string
	CreatedAt time.Time
	UpdatedAt time.Time
	roles     []string // unexported
}

func NewUser(name, email string) *User {
	now := time.Now().UTC()
	return &User{
		Name:      name,
		Email:     email,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (u *User) AddRole(role string) {
	for _, r := range u.roles {
		if r == role {
			return
		}
	}
	u.roles = append(u.roles, role)
}

func (u User) HasRole(role string) bool {
	for _, r := range u.roles {
		if r == role {
			return true
		}
	}
	return false
}

func (u User) String() string {
	return fmt.Sprintf("User{ID:%d Name:%q Email:%q}", u.ID, u.Name, u.Email)
}

// ── Generic types (Go 1.18+) ──────────────────────────────────────────────────

type Stack[T any] struct {
	items []T
	mu    sync.Mutex
}

func (s *Stack[T]) Push(item T) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	top := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return top, true
}

func (s *Stack[T]) Len() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.items)
}

type Number interface {
	~int | ~int32 | ~int64 | ~float32 | ~float64
}

func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n
	}
	return total
}

func Map[T, U any](slice []T, fn func(T) U) []U {
	result := make([]U, len(slice))
	for i, v := range slice {
		result[i] = fn(v)
	}
	return result
}

func Filter[T any](slice []T, pred func(T) bool) []T {
	var result []T
	for _, v := range slice {
		if pred(v) {
			result = append(result, v)
		}
	}
	return result
}

// ── Error handling ────────────────────────────────────────────────────────────

type AppError struct {
	Code    int
	Message string
	Cause   error
}

func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error { return e.Cause }

var (
	ErrNotFound     = &AppError{Code: 404, Message: "not found"}
	ErrUnauthorized = &AppError{Code: 401, Message: "unauthorized"}
)

func riskyOperation(input string) (int, error) {
	n, err := strconv.Atoi(input)
	if err != nil {
		return 0, fmt.Errorf("parsing %q: %w", input, err)
	}
	if n < 0 {
		return 0, &AppError{Code: 400, Message: "negative input", Cause: nil}
	}
	return n * 2, nil
}

// ── Goroutines and channels ───────────────────────────────────────────────────

func producer(ctx context.Context, out chan<- int) {
	defer close(out)
	for i := 0; ; i++ {
		select {
		case <-ctx.Done():
			return
		case out <- i:
		}
	}
}

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		results <- job * job
	}
}

func fanOut(ctx context.Context, n int) []int {
	jobs    := make(chan int, 10)
	results := make(chan int, 10)
	var wg sync.WaitGroup

	for i := 0; i < n; i++ {
		wg.Add(1)
		go worker(i, jobs, results, &wg)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	for i := 0; i < 20; i++ {
		jobs <- i
	}
	close(jobs)

	var out []int
	for r := range results {
		out = append(out, r)
	}
	return out
}

// ── Atomic counter ────────────────────────────────────────────────────────────

type Counter struct {
	value atomic.Int64
}

func (c *Counter) Increment() int64 { return c.value.Add(1) }
func (c *Counter) Get() int64       { return c.value.Load() }
func (c *Counter) Reset()            { c.value.Store(0) }

// ── Closures and defer ────────────────────────────────────────────────────────

func withTiming(label string, fn func()) {
	start := time.Now()
	defer func() {
		fmt.Printf("%s took %v\n", label, time.Since(start))
	}()
	fn()
}

func memoize[K comparable, V any](fn func(K) V) func(K) V {
	cache := make(map[K]V)
	var mu sync.Mutex
	return func(key K) V {
		mu.Lock()
		defer mu.Unlock()
		if v, ok := cache[key]; ok {
			return v
		}
		v := fn(key)
		cache[key] = v
		return v
	}
}

// ── Strings ───────────────────────────────────────────────────────────────────

func stringExamples() {
	s1        := "Hello, World!"
	s2        := `raw string: no \escapes here`
	multiline := `line one
line two
line three`

	upper   := strings.ToUpper(s1)
	split   := strings.Fields(s1)
	joined  := strings.Join(split, "-")
	trimmed := strings.TrimSpace("  hello  ")
	has     := strings.Contains(s1, "World")
	rep     := strings.Repeat("ab", 3)

	formatted := fmt.Sprintf("pi = %.4f, e = %.4f", math.Pi, math.E)
	built     := strings.Builder{}
	built.WriteString("hello")
	built.WriteByte(' ')
	built.WriteString("world")

	fmt.Println(s1, s2)
	fmt.Println(multiline)
	fmt.Println(upper, joined, trimmed, has, rep)
	fmt.Println(formatted, built.String())
}

// ── Sorting and slices ────────────────────────────────────────────────────────

func sliceExamples() {
	nums := []int{5, 3, 1, 4, 2}
	sort.Ints(nums)
	fmt.Println(nums)

	sort.Slice(nums, func(i, j int) bool { return nums[i] > nums[j] })
	fmt.Println(nums)

	words := []string{"banana", "apple", "cherry", "date"}
	sort.Strings(words)
	fmt.Println(words)

	// Append and copy
	a := make([]int, 0, 8)
	for i := range 5 {
		a = append(a, i*i)
	}
	b := make([]int, len(a))
	copy(b, a)
	fmt.Println(a, b)
}

// ── Maps ──────────────────────────────────────────────────────────────────────

func mapExamples() {
	freq := make(map[string]int)
	words := strings.Fields("the quick brown fox jumps over the lazy dog the fox")
	for _, w := range words {
		freq[w]++
	}

	// Delete
	delete(freq, "the")

	// Check existence
	if count, ok := freq["fox"]; ok {
		fmt.Printf("fox appears %d times\n", count)
	}

	// Iterate (non-deterministic order)
	keys := make([]string, 0, len(freq))
	for k := range freq {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Printf("  %s: %d\n", k, freq[k])
	}
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	p1 := NewPoint(1, 2)
	p2 := NewPoint(4, 6)
	fmt.Printf("distance = %.4f\n", p1.Distance(p2))
	p1.Scale(2.0)
	fmt.Println(p1)

	u := NewUser("Alice", "alice@example.com")
	u.AddRole("admin")
	u.AddRole("user")
	fmt.Println(u, "admin?", u.HasRole("admin"))

	s := &Stack[int]{}
	for _, n := range []int{1, 2, 3, 4, 5} {
		s.Push(n)
	}
	fmt.Printf("stack size = %d\n", s.Len())
	if top, ok := s.Pop(); ok {
		fmt.Printf("popped = %d\n", top)
	}

	nums := []int{1, 2, 3, 4, 5}
	fmt.Println(Sum(nums))
	squares := Map(nums, func(n int) int { return n * n })
	fmt.Println(squares)
	evens := Filter(nums, func(n int) bool { return n%2 == 0 })
	fmt.Println(evens)

	if n, err := riskyOperation("21"); err != nil {
		var appErr *AppError
		if errors.As(err, &appErr) {
			fmt.Fprintln(os.Stderr, "app error:", appErr)
		} else {
			fmt.Fprintln(os.Stderr, err)
		}
	} else {
		fmt.Println("result =", n)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	counter := &Counter{}
	var wg sync.WaitGroup
	for range 10 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Increment()
		}()
	}
	wg.Wait()
	fmt.Println("counter =", counter.Get())

	withTiming("sliceExamples", sliceExamples)
	mapExamples()
	stringExamples()
	_ = ctx
}
