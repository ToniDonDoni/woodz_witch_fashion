#include "ofMain.h"
#include <cmath>
#include <cstdint>
#include <random>
#include <vector>

// The C++ scene owns all environmental effects; the HTML host overlays the approved walk atlas.
class ForestEffectsApp final : public ofBaseApp {
public:
    void setup() override { ofSetFrameRate(60); buildAct(0); }
    void update() override {
        const int next = static_cast<int>(ofGetElapsedTimef() / 11.0f);
        if (next != act_) buildAct(next);
    }
    void draw() override {
        const float t = ofGetElapsedTimef(), w = ofGetWidth(), h = ofGetHeight();
        ofBackground(3, 3, 9);
        ofPushStyle();
        ofEnableBlendMode(OF_BLENDMODE_ADD);
        const float ground = h * .86f;
        // A new seeded woodland tableau appears every eleven seconds.
        for (const auto& tree : trees_) {
            // The walker faces left, so scenery must travel right toward her.
            const float x = std::fmod(tree.x * w + t * (12 + tree.depth * 23), w + 180);
            const float trunk = h * (.20f + tree.depth * .27f);
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
            const float x = std::fmod(p.x * w + t * p.vx + w*10, w);
            const float y = p.y*h + std::sin(t*p.freq + p.phase)*p.amplitude;
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
    struct Particle { float x,y,vx,freq,phase,amplitude,size; ofColor tint; };
    struct Tree { float x,depth; ofColor tint; };
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
