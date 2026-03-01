/*
 * sample.c — Theme fixture: C language
 *
 * Open in Extension Development Host (F5) and use
 * "Developer: Inspect Editor Tokens and Scopes" to verify colours.
 *
 * Expected colour mapping:
 *   keywords          → teal italic   (#45c6d6)
 *   types             → coral red     (#ff8080)
 *   storage types     → dusty mauve   (#d69aa7)
 *   functions         → warm tan      (#d6cf9a)
 *   members/variables → sandy orange  (#c19a7a)
 *   parameters        → dark sienna   (#8a602c)
 *   strings           → amber         (#d69545)
 *   comments          → cool grey italic (#a8abb0)
 *   preprocessor      → hot pink      (#ff6aad)
 *   constants/numbers → dark sienna   (#8a602c)
 */

/* ── Preprocessor ─────────────────────────────────────────────────────────── */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

#define MAX_SIZE        256
#define PI              3.14159265358979
#define SQUARE(x)       ((x) * (x))
#define STRINGIFY(s)    #s
#define CONCAT(a, b)    a ## b

#ifdef DEBUG
#  define LOG(fmt, ...) fprintf(stderr, "[DBG] " fmt "\n", __VA_ARGS__)
#else
#  define LOG(fmt, ...)
#endif

#pragma once

/* ── Typedef / struct / enum ─────────────────────────────────────────────────*/

typedef unsigned char  u8;
typedef unsigned short u16;
typedef unsigned int   u32;
typedef unsigned long  u64;

typedef enum {
    DIRECTION_NORTH = 0,
    DIRECTION_SOUTH,
    DIRECTION_EAST,
    DIRECTION_WEST,
    DIRECTION_COUNT
} Direction;

typedef struct {
    float x;
    float y;
    float z;
} Vec3;

typedef struct Node {
    int            value;
    struct Node   *next;
    struct Node   *prev;
} Node;

typedef void (*Callback)(int event_id, void *user_data);

/* ── Function declarations ───────────────────────────────────────────────────*/

/**
 * @brief  Compute the dot product of two vectors.
 * @param  a  First vector (input).
 * @param  b  Second vector (input).
 * @return    Scalar dot product a·b.
 */
static float vec3_dot(const Vec3 *a, const Vec3 *b);
static Vec3  vec3_add(Vec3 a, Vec3 b);
static Vec3  vec3_scale(Vec3 v, float s);

Node *node_create(int value);
void  node_free(Node *node);
void  node_list_push(Node **head, int value);

/* ── Function definitions ────────────────────────────────────────────────────*/

static float vec3_dot(const Vec3 *a, const Vec3 *b)
{
    return a->x * b->x + a->y * b->y + a->z * b->z;
}

static Vec3 vec3_add(Vec3 a, Vec3 b)
{
    Vec3 result;
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    result.z = a.z + b.z;
    return result;
}

static Vec3 vec3_scale(Vec3 v, float s)
{
    return (Vec3){ v.x * s, v.y * s, v.z * s };
}

Node *node_create(int value)
{
    Node *n = (Node *)malloc(sizeof(Node));
    if (!n) return NULL;
    n->value = value;
    n->next  = NULL;
    n->prev  = NULL;
    return n;
}

void node_free(Node *node)
{
    if (node) free(node);
}

void node_list_push(Node **head, int value)
{
    Node *n = node_create(value);
    if (!n) return;
    n->next = *head;
    if (*head) (*head)->prev = n;
    *head = n;
}

/* ── Control flow ────────────────────────────────────────────────────────────*/

int classify(int n)
{
    if (n < 0) {
        return -1;
    } else if (n == 0) {
        return 0;
    } else {
        return 1;
    }
}

const char *direction_name(Direction d)
{
    switch (d) {
        case DIRECTION_NORTH: return "north";
        case DIRECTION_SOUTH: return "south";
        case DIRECTION_EAST:  return "east";
        case DIRECTION_WEST:  return "west";
        default:              return "unknown";
    }
}

void iterate_examples(void)
{
    /* for loop */
    for (int i = 0; i < MAX_SIZE; ++i) {
        if (i % 2 == 0) continue;
        if (i > 10)     break;
        LOG("i = %d", i);
    }

    /* while / do-while */
    int count = 0;
    while (count < 5) ++count;

    do {
        --count;
    } while (count > 0);

    /* pointer arithmetic */
    int  buf[8] = { 1, 2, 3, 4, 5, 6, 7, 8 };
    int *p       = buf;
    int *end     = buf + 8;
    while (p < end) {
        *p++ *= 2;
    }
}

/* ── Strings and escape sequences ────────────────────────────────────────────*/

void string_examples(void)
{
    const char *greeting  = "Hello, World!\n";
    const char *escaped   = "tab:\there\nnewline";
    const char *hex_str   = "\x48\x65\x6c\x6c\x6f";   /* "Hello" */
    char        formatted[64];

    snprintf(formatted, sizeof(formatted), "pi = %.4f", PI);
    printf("%s\n", greeting);

    /* multiline string via concatenation */
    const char *multi =
        "line one\n"
        "line two\n"
        "line three\n";
    (void)multi;
    (void)escaped;
    (void)hex_str;
}

/* ── Bitwise and arithmetic ───────────────────────────────────────────────────*/

u32 bit_tricks(u32 x)
{
    u32 cleared = x & ~(1u << 4);
    u32 toggled = x ^ (1u << 7);
    u32 shifted = (x >> 3) | (x << (32 - 3));   /* rotate right 3 */
    return cleared | toggled | shifted;
}

/* ── main ──────────────────────────────────────────────────────────────────── */

int main(int argc, char *argv[])
{
    (void)argc;
    (void)argv;

    Vec3 a = { 1.0f, 0.0f, 0.0f };
    Vec3 b = { 0.0f, 1.0f, 0.0f };
    float dot = vec3_dot(&a, &b);
    Vec3 sum  = vec3_add(a, b);
    Vec3 scaled = vec3_scale(sum, 2.5f);

    printf("dot = %f\n", dot);
    printf("scaled = (%.2f, %.2f, %.2f)\n",
           scaled.x, scaled.y, scaled.z);

    Node *list = NULL;
    for (int i = 0; i < 5; ++i) node_list_push(&list, i * 10);

    for (Node *cur = list; cur != NULL; cur = cur->next) {
        printf("%d -> ", cur->value);
    }
    printf("NULL\n");

    /* free the list */
    Node *cur = list;
    while (cur) {
        Node *tmp = cur->next;
        node_free(cur);
        cur = tmp;
    }

    return EXIT_SUCCESS;
}
