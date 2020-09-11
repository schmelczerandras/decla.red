#version 300 es

precision lowp float;

#define LINE_COUNT {lineCount}
#define BLOB_COUNT {blobCount}
 
uniform float maxMinDistance;
uniform float pixelSize;

in vec2 position;

#if LINE_COUNT > 0
    uniform struct {
        vec2 from;
        vec2 toFromDelta;
        float fromRadius;
        float toRadius;
    }[LINE_COUNT] lines;

    void lineMinDistance(inout float minDistance, inout float color) {
        float myMinDistance = maxMinDistance;
        for (int i = 0; i < LINE_COUNT; i++) {
            vec2 targetFromDelta = position - lines[i].from;
            vec2 toFromDelta = lines[i].toFromDelta;
            
            float h = clamp(
                dot(targetFromDelta, toFromDelta) / dot(toFromDelta, toFromDelta),
                0.0, 1.0
            );

            float lineDistance = -mix(
                lines[i].fromRadius, lines[i].toRadius, h
            ) + distance(
                targetFromDelta, toFromDelta * h
            );

            myMinDistance = min(myMinDistance, lineDistance);
        }

        color = mix(0.0, color, step(pixelSize, -myMinDistance));

        minDistance = -myMinDistance;
    }
#endif

#if BLOB_COUNT > 0
    uniform struct {
        vec2 headCenter;
        vec2 torsoCenter;
        vec2 leftFootCenter;
        vec2 rightFootCenter;
        float headRadius;
        float torsoRadius;
        float footRadius;
        float k;
    }[BLOB_COUNT] blobs;

    float circleMinDistance(vec2 circleCenter, float radius) {
        return distance(position, circleCenter) - radius;
    }

    void blobMinDistance(inout float minDistance, inout float color) {
        for (int i = 0; i < BLOB_COUNT; i++) {
            float res = exp2(-blobs[i].k * circleMinDistance(blobs[i].headCenter, blobs[i].headRadius));
            res += exp2(-blobs[i].k * circleMinDistance(blobs[i].torsoCenter, blobs[i].torsoRadius));
            res += exp2(-blobs[i].k * circleMinDistance(blobs[i].leftFootCenter, blobs[i].footRadius));
            res += exp2(-blobs[i].k * circleMinDistance(blobs[i].rightFootCenter, blobs[i].footRadius));
            res = -log2(res) / blobs[i].k;

            color = mix(1.0, color, step(pixelSize, res));
            
            minDistance = min(minDistance, res);
        }
    }
#endif

out vec2 fragmentColor;

void main() {
    float minDistance = -maxMinDistance;
    float color = 0.0;

    #if LINE_COUNT > 0
        lineMinDistance(minDistance, color);
    #endif

    #if BLOB_COUNT > 0
        blobMinDistance(minDistance, color);
        //fragmentColor = vec2(-1.0, 2.0);
        //return;
    #endif

    fragmentColor = vec2(minDistance, color);
}
