const debug = require('debug')('stitcheroo');
const child_process = require('child_process');
const fs = require('fs');
const ffprobe = require('ffprobe-static');
const ffmpeg = require('ffmpeg-static');
const shortid = require('shortid').generate;
const boxjam = require('boxjam');

// Delete created files when they've been loaded into memory
// or if the program crashes.
function cleanUp(filePath){

    fs.unlink(filePath, err => {

        if(err){
            debug(`Unable to delete file ${filePath}:`, err);
        }

    });

}

function probeVideo(filePath){

    return new Promise( (resolve, reject) => {

        const probe = child_process.spawn(ffprobe.path, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'default=noprint_wrappers=1:nokey=1', filePath])

        probe.stdout.on('data', (data) => {

            data = data.toString('utf8');

            const textBasedDimensions = data.split('\n');
            const result = {
                width : Number(textBasedDimensions[0]),
                height : Number(textBasedDimensions[1]),
                path : filePath
            };

            resolve(result);

        });

        probe.stderr.on('data', (data) => {
            debug(`FFProbe stderr: ${data}`);
        });

        probe.on('close', (code) => {
            debug(`FFProbe exited with code ${code}`);

            if(code === 1){
                reject('FFProbe did not behave as expected.');
            }

        });

    });

}

function stitchVideo(videos, container, margin, shouldCenter){

    return new Promise( (resolve, reject) => {

        const OUTPUT_FILE_NAME = `${shortid()}.mp4`
        const boxes = boxjam(videos, container, margin, shouldCenter);

        let FILTER = `"[0:v]scale=${container.width}:${container.height}[bg]; `

        // Scale inputs
        for(let i = 0; i < videos.length; i += 1){

            FILTER += `[${i + 1}:v]scale=${boxes[i].width}:${boxes[i].height},setpts=PTS-STARTPTS[fg${i + 1}]; `

        }

        FILTER += `[bg][fg1]overlay=${boxes[0].x}:${boxes[0].y}:shortest=1[ol0]; `

        // Overlay inputs

        let lastKey = "ol0";

        for(let j = 1; j < videos.length; j += 1){

            const thisKey = `ol${shortid()}`;

            FILTER += `[${lastKey}][fg${j + 1}]overlay=${boxes[j].x}:${boxes[j].y},format=yuv420p[${thisKey}]${ j === videos.length -1 ? `"` : `;` }`
            lastKey =  thisKey;

        }

        // Construct input arguments
        const INPUT_STREAM_CHANNELS_FLAGS = videos.map((i, idx) => { return `[${idx+1}]` }).join('');

        let stitchArguments = ['-loop', 1, '-i', `${__dirname}/vid_back.png`, ];

        const inputArguments = [];

        for(let v = 0; v < boxes.length; v += 1){

            inputArguments.push('-i');
            inputArguments.push(`${boxes[v].path}`);

        }

        // Construct the video + audio filter arguments and output paths
        const filterArguments = ['-filter_complex', FILTER, '-map', `"[${lastKey}]"`, '-movflags', '+faststart ', '-filter_complex', `"${INPUT_STREAM_CHANNELS_FLAGS}`, `amix=inputs=${videos.length}"`, '-c:a', 'mp3', OUTPUT_FILE_NAME, '-y'];

        // And combine all of the arguments
        stitchArguments = stitchArguments.concat(inputArguments, filterArguments);

        // Then execute!
        const stitch = child_process.spawn(ffmpeg, stitchArguments, { shell: true });

        stitch.stdout.on('data', (data) => {

            debug(data);

        });

        stitch.stderr.on('data', (data) => {
            debug(`stderr: ${data}`);
        });

        stitch.on('close', (code) => {
            debug(`child process exited with code ${code}`);

            if(code === 0){

                fs.readFile(`${__dirname}/${OUTPUT_FILE_NAME}`, (err, data) => {
                    
                    cleanUp(`${__dirname}/${OUTPUT_FILE_NAME}`);
                    if(err){
                        debug('Filesystem read err:'. err);
                        reject(err);
                    } else {
                        resolve(data);
                    }

                });

            } else {
                debug(`FFMPEG exited and was not happy. Error code: ${code}`);
                reject();
                cleanUp(`${__dirname}/${OUTPUT_FILE_NAME}`);
            }

        });

    });


}

module.exports = (videos) => {

    const inputFiles = videos.map(filePath => probeVideo(filePath));

    return Promise.all(inputFiles)
        .then(results => {

            // return results;
            return stitchVideo(results, {width : 1920, height : 1080}, 10, true);

        })
        .catch(err => {
            debug('err:', err);
            throw err;
        })
    ;

}