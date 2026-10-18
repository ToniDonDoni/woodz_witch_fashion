#include <cassert>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <random>
#include <vector>

// Native C++ regression tests for the deterministic scene-generation contract.
// This is an initial test scaffold; full runtime tests will exercise openFrameworks.
struct Creature {
    float angle;
    float radius;
    float speed;
};
std::vector<Creature> generate(std::uint32_t seed) {
    std::mt19937 rng(seed);
    std::uniform_real_distribution<float> unit(0.0f, 1.0f);
    std::vector<Creature> result;
    result.reserve(180);
    for (int i = 0; i < 180; ++i) {
        result.push_back({unit(rng) * 6.28318530718f,
                          25.0f + unit(rng) * 230.0f,
                          0.05f + unit(rng) * 0.42f});
        (void)unit(rng); // Particle size.
        (void)unit(rng); // Particle hue.
    }
    return result;
}
int main() {
    const auto first = generate(12731);
    const auto replay = generate(12731);
    const auto changed = generate(12732);
    assert(first.size() == 180);
    assert(replay.size() == first.size());
    bool seedChangesAppearance = false;
    for (std::size_t i = 0; i < first.size(); ++i) {
        assert(first[i].angle == replay[i].angle);
        assert(first[i].radius == replay[i].radius);
        assert(first[i].speed == replay[i].speed);
        assert(first[i].angle >= 0.0f && first[i].angle <= 6.283186f);
        assert(first[i].radius >= 25.0f && first[i].radius <= 255.0f);
        assert(first[i].speed >= 0.05f && first[i].speed <= 0.47f);
        seedChangesAppearance |= first[i].angle != changed[i].angle;
    }
    assert(seedChangesAppearance);
    std::cout << "scene rules: passed\n";
}
