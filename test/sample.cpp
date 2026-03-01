/*
 * sample.cpp — Theme fixture: C++ language (C++17 / C++20)
 *
 * Open in Extension Development Host (F5) and use
 * "Developer: Inspect Editor Tokens and Scopes" to verify colours.
 *
 * Key things to check visually:
 *   member access via . or ->  → bright yellow  (#fee45d)  ← distinct from C
 *   C++20 keywords             → teal italic    (#45c6d6)
 *   class/type names           → coral red      (#ff8080)
 *   Doxygen @tags              → muted green    (#66a334)
 *   enum members               → muted green    (#66a334)
 *   preprocessor               → hot pink       (#ff6aad)
 */

/* ── Preprocessor ─────────────────────────────────────────────────────────── */

#include <algorithm>
#include <array>
#include <concepts>
#include <coroutine>
#include <format>
#include <iostream>
#include <memory>
#include <optional>
#include <ranges>
#include <span>
#include <string>
#include <string_view>
#include <vector>

#define NODISCARD     [[nodiscard]]
#define LIKELY(x)     __builtin_expect(!!(x), 1)
#define UNLIKELY(x)   __builtin_expect(!!(x), 0)

#ifdef NDEBUG
#  define ASSERT(cond) ((void)(cond))
#else
#  include <cassert>
#  define ASSERT(cond) assert(cond)
#endif

/* ── Namespace ───────────────────────────────────────────────────────────────*/

namespace geom {
namespace detail {

// Forward declarations
template<typename T> class Vec2;
template<typename T> class Vec3;

} // namespace detail
} // namespace geom

/* ── C++20 Concepts ──────────────────────────────────────────────────────────*/

template<typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template<typename T>
concept Printable = requires(T t) {
    { std::cout << t } -> std::same_as<std::ostream &>;
};

template<typename T>
concept Container = requires(T t) {
    typename T::value_type;
    { t.begin() } -> std::input_iterator;
    { t.end()   } -> std::input_iterator;
    { t.size()  } -> std::convertible_to<std::size_t>;
};

/* ── Enum (class) ────────────────────────────────────────────────────────────*/

enum class Colour : uint8_t {
    Red   = 0,
    Green = 1,
    Blue  = 2,
    Alpha = 3,
};

enum class LogLevel {
    Trace,
    Debug,
    Info,
    Warning,
    Error,
    Fatal,
};

/* ── Struct / class ──────────────────────────────────────────────────────────*/

namespace geom {

/**
 * @brief  Immutable 2-D vector with arithmetic operators.
 * @tparam T  Numeric element type (int, float, double, …).
 */
template<Numeric T>
class Vec2 {
public:
    T x{};
    T y{};

    constexpr Vec2() noexcept = default;
    constexpr Vec2(T x_, T y_) noexcept : x(x_), y(y_) {}

    /* ── Arithmetic ──────────────────────────────────────────────────────── */

    [[nodiscard]] constexpr Vec2 operator+(Vec2 rhs) const noexcept {
        return { x + rhs.x, y + rhs.y };
    }
    [[nodiscard]] constexpr Vec2 operator-(Vec2 rhs) const noexcept {
        return { x - rhs.x, y - rhs.y };
    }
    [[nodiscard]] constexpr Vec2 operator*(T s) const noexcept {
        return { x * s, y * s };
    }
    [[nodiscard]] constexpr auto operator<=>(const Vec2 &) const = default;

    /** @return  Dot product of this and @p rhs. */
    [[nodiscard]] constexpr T dot(Vec2 rhs) const noexcept {
        return x * rhs.x + y * rhs.y;
    }

    /** @return  Squared length (avoids sqrt). */
    [[nodiscard]] constexpr T length_sq() const noexcept {
        return dot(*this);
    }

    void print(std::ostream &out = std::cout) const {
        out << "(" << x << ", " << y << ")\n";
    }

private:
    static constexpr std::size_t k_dims = 2;
};

using Vec2f = Vec2<float>;
using Vec2i = Vec2<int>;

/* ── Inheritance ─────────────────────────────────────────────────────────────*/

struct Shape {
    virtual ~Shape()                                   = default;
    [[nodiscard]] virtual double area()    const       = 0;
    [[nodiscard]] virtual double perimeter() const     = 0;
    virtual void draw(std::ostream &out)   const       = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double radius) : m_radius(radius) {}

    [[nodiscard]] double area()       const override { return k_pi * m_radius * m_radius; }
    [[nodiscard]] double perimeter()  const override { return 2.0 * k_pi * m_radius;      }
    void draw(std::ostream &out)      const override {
        out << std::format("Circle(r={})\n", m_radius);
    }

    [[nodiscard]] double radius() const noexcept { return m_radius; }
    void set_radius(double r) {
        ASSERT(r > 0.0);
        m_radius = r;
    }

private:
    double m_radius;
    static constexpr double k_pi = 3.141592653589793;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : m_width(w), m_height(h) {}

    [[nodiscard]] double area()      const override { return m_width * m_height;          }
    [[nodiscard]] double perimeter() const override { return 2.0 * (m_width + m_height);  }
    void draw(std::ostream &out)     const override {
        out << std::format("Rect({}x{})\n", m_width, m_height);
    }

private:
    double m_width;
    double m_height;
};

} // namespace geom

/* ── Templates ───────────────────────────────────────────────────────────────*/

template<Container C>
void print_all(const C &container, std::string_view label = "")
{
    if (!label.empty()) std::cout << label << ": ";
    for (const auto &elem : container) {
        std::cout << elem << " ";
    }
    std::cout << "\n";
}

template<Numeric T>
[[nodiscard]] constexpr T clamp(T value, T lo, T hi) noexcept
{
    return value < lo ? lo : (value > hi ? hi : value);
}

/* ── Smart pointers / RAII ───────────────────────────────────────────────────*/

std::unique_ptr<geom::Shape> make_shape(bool circle)
{
    if (circle) return std::make_unique<geom::Circle>(5.0);
    else        return std::make_unique<geom::Rectangle>(3.0, 4.0);
}

/* ── C++20 Coroutine (generator-like) ────────────────────────────────────────*/

struct Generator {
    struct promise_type {
        int current_value{};
        Generator get_return_object() {
            return Generator{ std::coroutine_handle<promise_type>::from_promise(*this) };
        }
        std::suspend_always initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }
        std::suspend_always yield_value(int v) noexcept {
            current_value = v;
            return {};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    std::coroutine_handle<promise_type> handle;

    explicit Generator(std::coroutine_handle<promise_type> h) : handle(h) {}
    ~Generator() { if (handle) handle.destroy(); }

    bool next() {
        handle.resume();
        return !handle.done();
    }
    int value() const { return handle.promise().current_value; }
};

Generator iota(int start, int stop)
{
    for (int i = start; i < stop; ++i) {
        co_yield i;
    }
}

/* ── Lambdas, ranges, structured bindings ─────────────────────────────────── */

void modern_features()
{
    /* structured bindings */
    std::array<int, 5> arr = { 5, 3, 1, 4, 2 };
    auto [first, second, third, fourth, fifth] = arr;
    (void)first; (void)second; (void)third; (void)fourth; (void)fifth;

    /* lambda with capture */
    int multiplier = 3;
    auto triple = [multiplier](int x) noexcept -> int { return x * multiplier; };

    /* C++20 ranges */
    auto evens = arr
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; });

    for (int v : evens) std::cout << v << " ";
    std::cout << "\n";

    /* optional */
    std::optional<std::string> maybe = "hello";
    if (maybe.has_value()) {
        std::cout << maybe->length() << "\n";  // member access on optional
    }

    /* fold expression */
    auto sum = [](auto... args) { return (args + ...); };
    std::cout << sum(1, 2, 3, 4, 5) << "\n";

    /* if constexpr */
    auto describe = []<typename T>(T val) {
        if constexpr (std::is_integral_v<T>)
            std::cout << "integer: " << val << "\n";
        else if constexpr (std::is_floating_point_v<T>)
            std::cout << "float: " << val << "\n";
        else
            std::cout << "other\n";
    };
    describe(42);
    describe(3.14);

    std::cout << triple(7) << "\n";
}

/* ── Member access (bright yellow in C++) ────────────────────────────────────*/

void member_access_showcase()
{
    geom::Vec2f v1{ 1.0f, 2.0f };
    geom::Vec2f v2{ 3.0f, 4.0f };

    // . access — should render bright yellow
    float d   = v1.dot(v2);
    float len = v1.length_sq();
    v1.print();

    // -> access — should render bright yellow
    auto shape = make_shape(true);
    double a   = shape->area();
    double p   = shape->perimeter();
    shape->draw(std::cout);

    (void)d; (void)len; (void)a; (void)p;
}

/* ── Strings ─────────────────────────────────────────────────────────────────*/

void string_examples()
{
    std::string        s1 = "Hello, World!";
    std::string_view   sv = "lightweight view";
    const std::string  s2 = "escaped: \t tab \n newline \\ backslash";

    // Raw string literal
    const std::string raw = R"(no \escapes "here" <xml/>)";

    // std::format (C++20)
    auto msg = std::format("s1={}, len={}", s1, s1.size());
    std::cout << msg << "\n";
    std::cout << raw << "\n";
    (void)sv; (void)s2;
}

/* ── main ────────────────────────────────────────────────────────────────────*/

int main()
{
    geom::Vec2f a{ 1.0f, 0.0f };
    geom::Vec2f b{ 0.0f, 1.0f };
    geom::Vec2f c = a + b;
    c.print();

    auto shapes = std::vector<std::unique_ptr<geom::Shape>>{};
    shapes.push_back(std::make_unique<geom::Circle>(3.0));
    shapes.push_back(std::make_unique<geom::Rectangle>(4.0, 5.0));

    for (const auto &shape : shapes) {
        std::cout << std::format("area={:.3f}  perim={:.3f}\n",
                                 shape->area(), shape->perimeter());
    }

    auto gen = iota(0, 5);
    while (gen.next()) std::cout << gen.value() << " ";
    std::cout << "\n";

    modern_features();
    member_access_showcase();
    string_examples();

    return 0;
}
