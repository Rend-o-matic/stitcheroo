const child_process = require('child_process');
const ffprobe = require('ffprobe-static');
const ffmpeg = require('ffmpeg-static');
const shortid = require('shortid').generate;
const boxjam = require('boxjam');

const inputFiles = ['1.mov', '2_mod.mov', '3_mod.mov', '2_mod.mov', '3_mod.mov', '1.mov', '3_mod.mov', '1.mov', '2_mod.mov', '2_mod.mov', '3_mod.mov', '1.mov', '1.mov', '2_mod.mov', '3_mod.mov', '2_mod.mov', '1.mov',  '2_mod.mov',  '3_mod.mov',  '2_mod.mov',  '1.mov',  '2_mod.mov',  '3_mod.mov',  '1.mov'].map(filePath => {
    return new Promise( (resolve, reject) => {
        child_process.exec(`${ffprobe.path} -v error -show_entries stream=width,height -of default=noprint_wrappers=1:nokey=1 ${filePath}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              reject();
            }

            const r = stdout.split('\n');
            const data = {
                width : Number(r[0]),
                height : Number(r[1]),
                path : filePath
            };

            resolve(data);

        });
    } )
});

Promise.all(inputFiles)
    .then(results => {
        console.log(results);

        const boxes = boxjam(results, {width : 1920, height : 1080}, 10, true);

        const BASE_CMD = `${ffmpeg} -loop 1 -i vid_back.png`;

        const CMD_WITH_INPUTS = `${BASE_CMD} -i ${boxes.map(info => {return info.path}).join(' -i ')}`;

        console.log(CMD_WITH_INPUTS);

        let FILTER = `"[0:v]scale=1920:-1[bg]; `

        // Scale inputs
        for(let i = 0; i < inputFiles.length; i += 1){

            FILTER += `[${i + 1}:v]scale=${boxes[i].width}:${boxes[i].height},setpts=PTS-STARTPTS[fg${i + 1}]; `

        }

        FILTER += `[bg][fg1]overlay=${boxes[0].x}:${boxes[0].y}:shortest=1[ol0]; `

        // Overlay inputs

        let lastKey = "ol0";

        for(let j = 1; j < inputFiles.length; j += 1){

            const thisKey = `ol${shortid()}`;

            FILTER += `[${lastKey}][fg${j + 1}]overlay=${boxes[j].x}:${boxes[j].y},format=yuv420p[${thisKey}]${ j === inputFiles.length -1 ? '"' : ';' }`
            lastKey =  thisKey;

        }

        const INPUT_STREAM_CHANNELS_FLAGS = inputFiles.map((i, idx) => { return `[${idx+1}]` }).join('');

        // Combine audio streams

        const OUTPUT_FLAGS = `-map "[${lastKey}]" -movflags +faststart  -filter_complex "${INPUT_STREAM_CHANNELS_FLAGS} amix=inputs=${inputFiles.length}" -c:a mp3 output_dynamic.mp4 -y`

        const FINAL_CMD = `${CMD_WITH_INPUTS} -filter_complex ${FILTER} ${OUTPUT_FLAGS}`;

        console.log(FINAL_CMD);

        child_process.exec(FINAL_CMD, (error, stdout, stderr) => {
            if (error) {
            console.error(`exec error: ${error}`);
            return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });


    })
    .catch(err => {
        console.log('err:', err);
    })
;
