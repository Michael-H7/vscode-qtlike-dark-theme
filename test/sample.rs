// sample.rs — Theme fixture: Rust (2021 edition)
//
// Open in Extension Development Host (F5) and use
// "Developer: Inspect Editor Tokens and Scopes" to verify colours.
//
// Key things to check:
//   #[attributes]          → hot pink       (#ff6aad)
//   lifetime 'a            → coral red      (#ff8080)
//   trait names            → coral red      (#ff8080)
//   where clauses          → teal italic    (#45c6d6)
//   async / await          → teal italic    (#45c6d6)
//   macro_rules! / macros  → hot pink       (#ff6aad)

#![allow(dead_code, unused_variables)]
#![warn(clippy::all)]

use std::borrow::Cow;
use std::collections::HashMap;
use std::fmt;
use std::future::Future;
use std::io::{self, Read, Write};
use std::marker::PhantomData;
use std::ops::{Add, Mul, Neg};
use std::pin::Pin;
use std::sync::{Arc, Mutex, RwLock};
use std::task::{Context, Poll};

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RETRIES:  usize = 3;
const DEFAULT_CAP:  usize = 16;
const GOLDEN_RATIO: f64   = 1.618033988749895;

// ── Macros ────────────────────────────────────────────────────────────────────

macro_rules! bail {
    ($msg:literal $(,)?) => {
        return Err($msg.into())
    };
    ($fmt:expr, $($arg:tt)*) => {
        return Err(format!($fmt, $($arg)*).into())
    };
}

macro_rules! vec_of_strings {
    ($($s:expr),* $(,)?) => {
        vec![$($s.to_owned()),*]
    };
}

// ── Enums ─────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Direction {
    North,
    South,
    East,
    West,
}

impl fmt::Display for Direction {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Direction::North => write!(f, "north"),
            Direction::South => write!(f, "south"),
            Direction::East  => write!(f, "east"),
            Direction::West  => write!(f, "west"),
        }
    }
}

#[derive(Debug)]
pub enum AppError {
    Io(io::Error),
    Parse(String),
    NotFound { resource: String, id: u64 },
    Unauthorized,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(e)                          => write!(f, "IO error: {e}"),
            Self::Parse(msg)                     => write!(f, "parse error: {msg}"),
            Self::NotFound { resource, id }      => write!(f, "{resource} {id} not found"),
            Self::Unauthorized                   => write!(f, "unauthorized"),
        }
    }
}

impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io(e) => Some(e),
            _           => None,
        }
    }
}

impl From<io::Error> for AppError {
    fn from(e: io::Error) -> Self { Self::Io(e) }
}

pub type Result<T, E = AppError> = std::result::Result<T, E>;

// ── Structs ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vec2<T> {
    pub x: T,
    pub y: T,
}

impl<T: Add<Output = T> + Copy> Add for Vec2<T> {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        Self { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}

impl<T: Mul<Output = T> + Copy> Mul<T> for Vec2<T> {
    type Output = Self;
    fn mul(self, scalar: T) -> Self {
        Self { x: self.x * scalar, y: self.y * scalar }
    }
}

impl<T: Neg<Output = T>> Neg for Vec2<T> {
    type Output = Self;
    fn neg(self) -> Self { Self { x: -self.x, y: -self.y } }
}

impl<T: fmt::Display> fmt::Display for Vec2<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

impl<T: Add<Output = T> + Mul<Output = T> + Copy> Vec2<T> {
    pub fn new(x: T, y: T) -> Self { Self { x, y } }
    pub fn dot(self, other: Self) -> T { self.x * other.x + self.y * other.y }
}

// ── Traits ────────────────────────────────────────────────────────────────────

pub trait Serialize {
    fn serialize(&self) -> String;
}

pub trait Deserialize: Sized {
    fn deserialize(input: &str) -> Result<Self>;
}

pub trait Repository<T, Id> {
    fn find_by_id(&self, id: Id)  -> Option<&T>;
    fn save(&mut self, item: T)   -> Id;
    fn delete(&mut self, id: Id)  -> bool;
    fn count(&self)               -> usize;
}

pub trait Summary {
    fn summarize_author(&self) -> String;
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

// ── Trait with associated types + where ──────────────────────────────────────

pub trait Transformer {
    type Input;
    type Output;
    type Error: std::error::Error;

    fn transform(&self, input: Self::Input) -> std::result::Result<Self::Output, Self::Error>;
}

pub fn apply_all<T, I>(transformers: &[T], mut input: I) -> std::result::Result<I, T::Error>
where
    T: Transformer<Input = I, Output = I>,
    I: Clone,
{
    for t in transformers {
        input = t.transform(input.clone())?;
    }
    Ok(input)
}

// ── Lifetimes ─────────────────────────────────────────────────────────────────

pub struct StrSplit<'haystack, 'delimiter> {
    remainder:  &'haystack str,
    delimiter:  &'delimiter str,
}

impl<'h, 'd> StrSplit<'h, 'd> {
    pub fn new(haystack: &'h str, delimiter: &'d str) -> Self {
        Self { remainder: haystack, delimiter }
    }
}

impl<'h, 'd> Iterator for StrSplit<'h, 'd> {
    type Item = &'h str;

    fn next(&mut self) -> Option<Self::Item> {
        if self.remainder.is_empty() {
            return None;
        }
        if let Some(idx) = self.remainder.find(self.delimiter) {
            let part      = &self.remainder[..idx];
            self.remainder = &self.remainder[idx + self.delimiter.len()..];
            Some(part)
        } else {
            Some(std::mem::take(&mut self.remainder))
        }
    }
}

pub fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() >= y.len() { x } else { y }
}

// ── Generics with PhantomData ─────────────────────────────────────────────────

pub struct Typed<T, State> {
    value:  T,
    _state: PhantomData<State>,
}

pub struct Unvalidated;
pub struct Validated;

impl<T> Typed<T, Unvalidated> {
    pub fn new(value: T) -> Self {
        Self { value, _state: PhantomData }
    }
}

impl<T: PartialOrd + Default> Typed<T, Unvalidated> {
    pub fn validate(self) -> Result<Typed<T, Validated>> {
        if self.value < T::default() {
            bail!("value must be non-negative");
        }
        Ok(Typed { value: self.value, _state: PhantomData })
    }
}

impl<T> Typed<T, Validated> {
    pub fn get(&self) -> &T { &self.value }
}

// ── Async ─────────────────────────────────────────────────────────────────────

pub async fn fetch_data(url: &str) -> Result<Vec<u8>> {
    // Simulate async I/O
    tokio_mock_delay().await;
    if url.is_empty() { bail!("URL must not be empty"); }
    Ok(b"<response>".to_vec())
}

pub async fn fetch_all(urls: &[&str]) -> Vec<Result<Vec<u8>>> {
    let futures: Vec<_> = urls.iter().map(|u| fetch_data(u)).collect();
    // In real code: futures::future::join_all(futures).await
    let mut results = Vec::with_capacity(futures.len());
    for fut in futures {
        results.push(fut.await);
    }
    results
}

async fn tokio_mock_delay() {
    // placeholder for tokio::time::sleep
}

// ── Custom Future ─────────────────────────────────────────────────────────────

pub struct Countdown(u32);

impl Future for Countdown {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if self.0 == 0 {
            Poll::Ready(())
        } else {
            self.0 -= 1;
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

// ── Closures and iterators ────────────────────────────────────────────────────

pub fn fizzbuzz(n: u32) -> Vec<Cow<'static, str>> {
    (1..=n)
        .map(|i| match (i % 3, i % 5) {
            (0, 0) => Cow::Borrowed("FizzBuzz"),
            (0, _) => Cow::Borrowed("Fizz"),
            (_, 0) => Cow::Borrowed("Buzz"),
            _      => Cow::Owned(i.to_string()),
        })
        .collect()
}

pub fn word_count(text: &str) -> HashMap<&str, usize> {
    text.split_whitespace()
        .fold(HashMap::new(), |mut map, word| {
            *map.entry(word).or_insert(0) += 1;
            map
        })
}

// ── Unsafe block ─────────────────────────────────────────────────────────────

pub fn raw_pointer_demo() {
    let mut val = 42_i32;
    let raw_mut: *mut i32 = &mut val;
    unsafe {
        *raw_mut += 1;
        assert_eq!(*raw_mut, 43);
    }
}

// ── Pattern matching ─────────────────────────────────────────────────────────

pub fn classify(n: i64) -> &'static str {
    match n {
        i64::MIN..=-1 => "negative",
        0             => "zero",
        1..=9         => "single digit",
        10..=99       => "double digit",
        _             => "large",
    }
}

pub fn describe_option<T: fmt::Debug>(opt: Option<T>) -> String {
    match opt {
        Some(v) => format!("Some({v:?})"),
        None    => "None".to_owned(),
    }
}

// ── Arc + Mutex ───────────────────────────────────────────────────────────────

pub struct SharedCounter(Arc<Mutex<u64>>);

impl SharedCounter {
    pub fn new() -> Self { Self(Arc::new(Mutex::new(0))) }
    pub fn increment(&self) { *self.0.lock().unwrap() += 1; }
    pub fn get(&self)       -> u64 { *self.0.lock().unwrap() }
    pub fn clone_handle(&self) -> Self { Self(Arc::clone(&self.0)) }
}

// ── Strings ───────────────────────────────────────────────────────────────────

pub fn string_examples() {
    let owned:    String     = String::from("Hello, World!");
    let borrowed: &str       = "borrowed string slice";
    let raw:      &str       = r#"raw "string" \no\escapes"#;
    let byte_str: &[u8]      = b"byte string";
    let escaped:  &str       = "tab:\there\nnewline\n\"quoted\"";

    let interpolated = format!("pi = {:.4}", std::f64::consts::PI);
    let repeated     = "ab".repeat(3);       // "ababab"
    let trimmed      = "  hello  ".trim();

    let split: Vec<&str> = "a,b,c,d".split(',').collect();
    let joined           = split.join(" | ");

    println!("{owned}  {borrowed}  {interpolated}  {repeated}  {trimmed}  {joined}");
    println!("{raw}");
    let _ = (byte_str, escaped);
}

// ── main ──────────────────────────────────────────────────────────────────────

fn main() {
    let v1 = Vec2::new(1.0_f64, 2.0);
    let v2 = Vec2::new(3.0, 4.0);
    let sum = v1 + v2;
    println!("sum = {sum}, dot = {}", v1.dot(v2));

    let counter = SharedCounter::new();
    let handle  = counter.clone_handle();
    handle.increment();
    counter.increment();
    println!("counter = {}", counter.get());

    let fb = fizzbuzz(20);
    println!("{}", fb.join(", "));

    for entry in StrSplit::new("one::two::three", "::") {
        println!("{entry}");
    }

    let words = word_count("the quick brown fox the fox");
    println!("{words:?}");

    raw_pointer_demo();
    string_examples();

    let names = vec_of_strings!["Alice", "Bob", "Carol"];
    for name in &names {
        println!("{name}: {}", classify(name.len() as i64));
    }
}
