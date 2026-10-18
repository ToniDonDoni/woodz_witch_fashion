#include "ofMain.h"
#include <cmath>
#include <algorithm>
#include <cstdint>
#include <random>
#include <vector>
#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif

// The C++ scene owns all environmental effects; the HTML host overlays the approved walk atlas.
class ForestEffectsApp final : public ofBaseApp {
public:
    void setup() override { ofSetFrameRate(60); buildAct(0); }
    void update() override {
        const int next = static_cast<int>(ofGetElapsedTimef() / 11.0f);
        if (next != act_) buildAct(next);
    }
    // Screen-space quadrupole-inspired strain, not a physical GR solver.
    // Fixed physical scale: 100 px/m, two 5 kg legs, 0.2 m excursion.
    // The 140 px target at 480 px radius calibrates the reference strain.
    double gravityStrain(double x, double y, double t, double speed, double gain,
                         double w, double h) const {
        constexpr double pi = 3.141592653589793;
        constexpr double lightSpeed = 299792458.0;
        constexpr double physicalG = 6.67430e-11;
        constexpr double pixelsPerMeter = 100.0;
        constexpr double legMass = 5.0;
        constexpr double excursion = 0.2;
        constexpr double stepHz = 48.0 / 33.0;
        constexpr double omega = 2.0 * pi * stepHz;
        constexpr double quadAcceleration = 2.0 * legMass * excursion * excursion * omega * omega;
        const double dx = x - w * 0.5, dy = y - h * 0.84;
        const double radiusPx = std::max(40.0, std::hypot(dx, dy));
        const double radiusM = radiusPx / pixelsPerMeter;
        if (speed <= 0.0 || gain <= 0.0) return 0.0;
        const double effectiveC = lightSpeed / (speed * 1.0e8);
        const double effectiveG = physicalG * gain * 1.0e10;
        const double retardedTime = t - radiusM / effectiveC;
        if (retardedTime < 0.0 || gain <= 0.0) return 0.0;
        const double amplitude = 2.0 * effectiveG * quadAcceleration /
            (std::pow(effectiveC, 4.0) * radiusM);
        return std::clamp(amplitude * std::cos(omega * retardedTime), -2.0, 2.0);
    }
    void draw() override {
        const float t = ofGetElapsedTimef(), w = ofGetWidth(), h = ofGetHeight();
        ofBackground(3, 3, 9);
        ofPushStyle();
        ofEnableBlendMode(OF_BLENDMODE_ADD);
        const float ground = h * .86f;
        double speedFactor = 1.25, gravityFactor = 2.1;
#ifdef __EMSCRIPTEN__
        speedFactor = EM_ASM_DOUBLE({
            return Number.isFinite(window.gravitySpeedFactor) ? window.gravitySpeedFactor : 1.25;
        });
        gravityFactor = EM_ASM_DOUBLE({
            return Number.isFinite(window.gravityStrengthFactor) ? window.gravityStrengthFactor : 2.1;
        });
#endif
        speedFactor = std::clamp(speedFactor, 0.0, 12.5);
        gravityFactor = std::clamp(gravityFactor, 0.0, 21.0);
        // A new seeded woodland tableau appears every eleven seconds.
        for (const auto& tree : trees_) {
            // The walker faces left, so scenery must travel right toward her.
            const float baseX = std::fmod(tree.x * w + t * (12 + tree.depth * 23), w + 180);
            const float wave = gravityStrain(baseX, ground, t, speedFactor, gravityFactor, w, h);
            const float x = baseX + static_cast<float>(0.5 * wave * (baseX - w * .5f));
            const float trunk = h * (.20f + tree.depth * .27f) * (1.f - .5f * wave);
            ofSetColor(tree.tint, 40 + static_cast<int>(tree.depth * 55));
            ofSetLineWidth(1.2f + tree.depth * 2);
            ofDrawLine(x, ground, x + std::sin(t*.35f + tree.x*8)*9, ground-trunk);
            for (int k = 0; k < 5; ++k) {
                float y = ground - trunk * (.30f + k * .13f);
                float side = k % 2 ? -1.f : 1.f;
                ofDrawLine(x, y, x + side * (24 + tree.depth*45), y - (28 + tree.depth*20));
            }
        }
        for (const auto& p : particles_) {
            const float baseX = std::fmod(p.x * w + t * p.vx + w*10, w);
            const float wave = gravityStrain(baseX, p.y*h, t, speedFactor, gravityFactor, w, h);
            const float x = baseX + static_cast<float>(.5 * wave * (baseX - w*.5f));
            const float y = p.y*h + std::sin(t*p.freq + p.phase)*p.amplitude - static_cast<float>(.5 * wave * (p.y*h - h*.84f));
            ofSetColor(p.tint, 70 + static_cast<int>(80 * (.5f + .5f*std::sin(t + p.phase))));
            ofDrawCircle(x, y, p.size);
        }
        // Each act introduces a distinct motif, not just another particle palette.
        const int motif = act_ % 5;
        const float cx = w*.5f, cy = h*.44f;
        if (motif == 1 || motif == 4) {
            for (int i=0;i<7;++i) {
                float r = 55 + i*21 + std::sin(t*1.3f+i)*12;
                ofSetColor(130+i*12, 90, 240, 35);
                ofNoFill(); ofDrawCircle(cx, cy, r); ofFill();
            }
        }
        if (motif == 2 || motif == 4) {
            for (int i=0;i<9;++i) {
                float x = w*(.08f + i*.105f);
                float y = ground - 70 - std::sin(t*1.8f+i*1.7f)*34;
                ofSetColor(100, 230, 200, 85);
                ofDrawEllipse(x, y, 35, 9);
                ofDrawEllipse(x, y-9, 14, 21);
            }
        }
        if (motif == 3 || motif == 4) {
            for (int i=0;i<12;++i) {
                float x = w*(i+.5f)/12, y = h*(.22f + .15f*std::sin(i*2.f+t*.6f));
                ofSetColor(255, 160, 105, 110);
                ofDrawLine(x-14,y-10,x,y+15); ofDrawLine(x+14,y-10,x,y+15);
                ofDrawCircle(x,y,3);
            }
        }
        ofDisableBlendMode();
        ofPopStyle();
    }
private:
    struct Particle { float x,y,vx,freq,phase,amplitude,size; ofColor tint; float mass = .01f; };
    struct Tree { float x,depth; ofColor tint; float mass = 100.f; };
    void buildAct(int index) {
        act_ = index;
        std::mt19937 rng(12731u + static_cast<std::uint32_t>(index)*7919u);
        std::uniform_real_distribution<float> u(0.f,1.f);
        const ofColor palettes[] = {ofColor(160,105,245),ofColor(255,178,105),ofColor(105,230,205),ofColor(255,120,185),ofColor(140,170,255)};
        const ofColor tint=palettes[index%5];
        particles_.clear(); trees_.clear();
        for(int i=0;i<145;++i) particles_.push_back({u(rng),.12f+u(rng)*.7f,6+u(rng)*25,.5f+u(rng)*2,u(rng)*TWO_PI,5+u(rng)*20,.6f+u(rng)*2.2f,tint});
        for(int i=0;i<19;++i) trees_.push_back({u(rng),.3f+u(rng)*.7f,tint});
    }
    int act_=-1;
    std::vector<Particle> particles_;
    std::vector<Tree> trees_;
};
int main() { ofSetupOpenGL(960,540,OF_WINDOW); ofRunApp(std::make_shared<ForestEffectsApp>()); }
