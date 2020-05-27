// Manually input
/*
ffmpeg -loop 1 -i vid_back.png -i 1.mov -i 2.mov -i 3.mov -filter_complex \
"[0:v]scale=1920:-1[bg]; \
 [1:v]scale=934:526,setpts=PTS-STARTPTS[fg1]; \
 [2:v]scale=934:526,setpts=PTS-STARTPTS[fg2]; \
 [3:v]scale=934:526,setpts=PTS-STARTPTS[fg3]; \
 [bg][fg1]overlay=21:9:shortest=1[ol1]; \
 [ol1][fg2]overlay=965:9,format=yuv420p[om];\
 [om][fg3]overlay=493:545,format=yuv420p[v]" \
-map "[v]" -movflags +faststart  -filter_complex amerge=inputs=3 -ac 3 output.mp4 -y
*/

// Software Generated
/*
ffmpeg -loop 1 -i vid_back.png -i 1.mov -i 2.mov -i 3.mov -filter_complex \
"[0:v]scale=1920:-1[bg];\
[1:v]scale=934:526,setpts=PTS-STARTPTS[fg1];\
[2:v]scale=934:526,setpts=PTS-STARTPTS[fg2];\
[3:v]scale=934:526,setpts=PTS-STARTPTS[fg3];\
[bg][fg1]overlay=21:9:shortest=1[ol0];\
[ol0][fg2]overlay=965:9,format=yuv420p[ol0ys2Fi9_5];\
[ol0ys2Fi9_5][fg3]overlay=493:545,format=yuv420p[olOZJoXQdm9V]"\
 -map "[olOZJoXQdm9V]" -movflags +faststart  -filter_complex amerge=inputs=3 -ac 3 output.mp4 -y
*/

const shortid = require('shortid').generate;

const inputFiles = ['1.mov', '2.mov', '3.mov'];
const boxes = [{"id":1,"width":934,"height":526,"x":21,"y":9},{"id":2,"width":934,"height":526,"x":965,"y":9},{"id":3,"width":934,"height":526,"x":493,"y":545}];

const BASE_CMD = `ffmpeg -loop 1 -i vid_back.png`;

const CMD_WITH_INPUTS = `${BASE_CMD} -i ${inputFiles.join(' -i ')}`;

let FILTER = `"[0:v]scale=1920:-1[bg];\\\n`

// Scale inputs
for(let i = 0; i < inputFiles.length; i += 1){

    FILTER += `[${i + 1}:v]scale=${boxes[i].width}:${boxes[i].height},setpts=PTS-STARTPTS[fg${i + 1}];\\\n`

}

FILTER += `[bg][fg1]overlay=${boxes[0].x}:${boxes[0].y}:shortest=1[ol0];\\\n`

// Overlay inputs

let lastKey = "ol0";

for(let j = 1; j < inputFiles.length; j += 1){

    const thisKey = `ol${shortid()}`;

    FILTER += `[${lastKey}][fg${j + 1}]overlay=${boxes[j].x}:${boxes[j].y},format=yuv420p[${thisKey}]${ j === inputFiles.length -1 ? '"\\' : ';\\' }\n`
    lastKey =  thisKey;

}

const OUTPUT_FLAGS = `-map "[${lastKey}]" -movflags +faststart  -filter_complex amerge=inputs=${inputFiles.length} -ac ${inputFiles.length} output.mp4 -y`


console.log(CMD_WITH_INPUTS + ' -filter_complex \\\n' + FILTER + ` ${OUTPUT_FLAGS}`);