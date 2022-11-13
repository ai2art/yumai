const fs = require('fs');
const nodeFormData = require('form-data');
const axios = require('axios');
const http = require('http');

const DOMAIN = 'xxx.xxx.xxx.xxx';
const PORT_NUM = 1111;

// 接口地址
const url = `http://${DOMAIN}:${PORT_NUM}/api2`;

// 待上传图片的本地地址
const footageUri = "/path/to/footage.jpg"

const formData = new nodeFormData();

formData.append("footage", fs.createReadStream(footageUri));
formData.append("txt", "钢铁侠和爱因斯坦下象棋"); 
formData.append("steps", 10);

formData.submit(url, function(err, res) {
  let content = ''
  res.on('data', chunk=> {
    content = content + chunk
  });
  res.on('end', ()=>{

    const {thread_id, result_id} = JSON.parse(content);

    //查看任务进度的api
    const progUrl = `http://${DOMAIN}:${PORT_NUM}/progress/${thread_id}`;
    
    //获取结果图片的api
    const resultUrl = `http://${DOMAIN}:${PORT_NUM}/result/${result_id}`;

    //待保存到的图片本地地址
    const resultUri = '/path/to/result.png';
    const writeStream = fs.createWriteStream(resultUri, {flags: 'w'});

    updateProgress(progUrl, () => {
      http.get(resultUrl,(res)=>{
        res.pipe(writeStream, {end: false});
        res.on('close', ()=>{
          writeStream.close(()=>{
            console.log('image saved!')
          });
        });
      })
    })
  });
})


function updateProgress(url, cb) {
  let timerId = null;
  update();
  function update() {
    axios.get(url).then(res => {
      const {progress, status} = res.data;
      console.log(progress);

      if (status == 1) {
        clearTimeout(timerId);
        cb && cb();
      } else {
        timerId = setTimeout(update, 1000)
      }
    }).catch(err => {
      console.log(err)
    })
    
  }
}