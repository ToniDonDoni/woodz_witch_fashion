#include "ofMain.h"

#include <cmath>
#include <cstdint>
#include <random>
#include <vector>

// Experimental openFrameworks WASM scene. The walker is composed by the JS host.
class ForestEffectsApp final : public ofBaseApp {
public:
    void setup() override {
        ofSetBackgroundColor(ofColor::black);
        ofSetFrameRate(60);
        regenerate(12731);
    }

    void update() override {
        // All motion is derived from elapsed time, not from the number of frames drawn.
    }

    void draw() override {
        ofBackground(0);
        const float t = ofGetElapsedTimef();
        const float centerX = ofGetWidth() * 0.5f;
        const float centerY = ofGetHeight() * 0.55f;
        const float pulse = 1.0f + 0.12f * std::sin(t * 1.7f);

        ofPushStyle();
        ofEnableBlendMode(OF_BLENDMODE_ADD);
        for (const auto& p : motes_) {
            const float theta = p.angle + t * p.speed;
            const float x = centerX + std::cos(theta) * p.radius * pulse;
            const float y = centerY + std::sin(theta * 1.3f) * p.radius * 0.7f;
            ofSetColor(p.tint, 175);
            ofDrawCircle(x, y, p.size);
        }
        ofDisableBlendMode();
        ofPopStyle();
    }

    void keyPressed(int key) override {
        if (key == 'n' || key == 'N') {
            regenerate(++seed_);
        }
    }

private:
    struct Mote {
        float angle;
        float radius;
        float speed;
        float size;
        ofColor tint;
    };

    void regenerate(std::uint32_t seed) {
        seed_ = seed;
        std::mt19937 rng(seed);
        std::uniform_real_distribution<float> unit(0.0f, 1.0f);
        motes_.clear();
        motes_.reserve(180);
        for (int i = 0; i < 180; ++i) {
            const float hue = 155.0f + unit(rng) * 90.0f;
            Mote mote{
                unit(rng) * TWO_PI,
                25.0f + unit(rng) * 230.0f,
                0.05f + unit(rng) * 0.42f,
                0.7f + unit(rng) * 2.6f,
                ofColor::fromHsb(static_cast<unsigned char>(hue), 170, 255)
            };
            motes_.push_back(mote);
        }
    }

    std::uint32_t seed_ = 12731;
    std::vector<Mote> motes_;
};

int main() {
    ofSetupOpenGL(960, 540, OF_WINDOW);
    ofRunApp(std::make_shared<ForestEffectsApp>());
}
