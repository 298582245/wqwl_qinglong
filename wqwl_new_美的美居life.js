/**
 * 脚本：wqwl_new_美的美居life.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序美的美居life，抓包请求头的accessToken，regionsign,格式：accessToken#regionsign#备注1（备注可选）
 * 环境变量：wqwl_midea，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 3 8 * * *
 */

//ck1小时

//环境变量
const ckName = 'wqwl_midea';
//脚本名称
const scriptName = '微信小程序美的美居life';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 2;
//日志是否需要具体时间
const isNeedTimes = false;

const proxy = process.env["wqwl_daili"] || '';
const isProxy = process.env["wqwl_useProxy"] || false;
const bfs = process.env["wqwl_bfs"] || 3;
const isNotify = process.env["wqwl_isNotify"] || true;
const isDebug = process.env["wqwl_isDebug"] || 2;

/**
 * 其他全局环境变量说明
 * wqwl_daili：代理链接，需要返回单条txt格式
 * wqwl_useProxy：是否用代理，默认使用（填了代理链接）
 * wqwl_bfs：并发数，默认3
 * wqwl_isNotify：是否进行通知
 * wqwl_isDebug：是否调试输出请求
 */

const axios = require('axios');
const fs = require('fs');
const qs = require('qs');
const CryptoJS = require('crypto-js');

let wqwlkj;
// 先下载依赖文件
async function downloadRequire() {
    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
        return true;
    } else {
        console.log('正在下载wqwl_require.js，请稍等...\n');
        console.log(`如果下载过慢，可以手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本`);
        console.log('地址：' + url);
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅ 下载完成\n');
            wqwlkj = require('./wqwl_require');
            return true;
        } catch (e) {
            console.log('❌ 下载失败，请手动下载wqwl_require.js\n');
            console.log('地址：' + url);
            return false;
        }
    }
}

// 立即执行下载并等待完成
!(async function () {
    const downloadIsSuccess = await downloadRequire();
    if (!downloadIsSuccess) {
        console.log('❌ 依赖文件下载失败，脚本终止');
        process.exit(1);
    }
    if (!wqwlkj.WQWLBase || !wqwlkj.WQWLBaseTask) {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
        process.exit(1);
    }

    class Task extends wqwlkj.WQWLBaseTask {
        constructor(ck, index, base) {
            // 调用父类构造函数
            super(ck, index, base);
            this.baseUrl = 'https://mp-prod.smartmidea.net/mas/v5/app/proxy?alias=';

        }

        async init() {
            const ckData = this.ck.split('#');
            if (ckData.length < ckLength) {
                this.sendMessage(`${this.index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                return false;
            } else if (ckData.length === ckLength) {
                this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
            } else {
                this.remark = ckData[ckLength];
            }

            this.accessToken = ckData[0];
            this.regionsign = ckData[1];

            if (!this.base.fileData[this.remark])
                this.base.fileData[this.remark] = {}
            let ua;
            if (!this.base.fileData[this.remark]['ua']) {
                this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA()
            }
            ua = this.base.fileData[this.remark]['ua']

            this.sendMessage(`🎲 使用ua：${ua.slice(0, 60)}`)
            // 设置请求头
            this.headers =
            {
                'User-Agent': ua,
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9',
                'accesstoken': this.accessToken,
                'content-type': 'application/json',
                'iotappid': '901',
                'refer': 'pages/mytab/mytab',
                'regionsign': this.regionsign,
                'secretversion': '1.0',
                'terminalid': '901-default',
                'xweb_xhr': '1',
                'Referer': 'https://servicewechat.com/wxb12ff482a3185e46/277/page-frame.html',
                'Referrer-Policy': 'unsafe-url'
            };

            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig);
                this.sendMessage(`✅ 使用代理：${this.proxy}`);
            } else {
                this.proxy = '';
            }

            return true;
        }

        // 签到
        async sign() {
            const methodName = '签到';


            const method = async () => {
                const data = { "headParams": { "language": "CN", "originSystem": "MCSP", "timeZone": "", "userCode": "", "tenantCode": "", "userKey": "", "transactionId": "" }, "restParams": {} }
                const headers = JSON.parse(JSON.stringify(this.headers))
                const timestamp = Date.now()
                headers['random'] = timestamp
                headers['sign'] = this.generateSign(data, timestamp, 'POST')
                const options = {
                    url: `${this.baseUrl}/api/cms_api/activity-center-im-service/im-svr/im/game/page/meiJu/newSign`,
                    headers: headers,
                    method: "POST",
                    data: data
                };

                const res = await this.request(options, 0);
                if (res?.data?.dayRewardResult) {
                    this.sendMessage(`✅ [${methodName}] 成功，获得积分：${parseInt(res?.data?.dayRewardPointValue) + parseInt(res?.data?.extraRewardPointValue) || 0}`, true)
                } else {
                    throw new Error(`接口返回：${res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        //积分信息
        async info() {
            const methodName = '信息';


            const method = async () => {
                const data = { "headParams": { "language": "CN", "originSystem": "MCSP", "timeZone": "", "userCode": "", "tenantCode": "", "userKey": "", "transactionId": "" }, "restParams": {} }
                const headers = JSON.parse(JSON.stringify(this.headers))
                const timestamp = Date.now()
                headers['random'] = timestamp
                headers['sign'] = this.generateSign(data, timestamp, 'POST')
                const options = {
                    url: `${this.baseUrl}/api/cms_api/activity-center-im-service/im-svr/im/game/page/meiJu/newSign/query`,
                    headers: headers,
                    method: "POST",
                    data: data
                };

                const res = await this.request(options, 0);
                if (res?.code === "000000") {
                    this.sendMessage(`✅ [${methodName}] 成功，连续签到天数：${res?.data?.contRegisterNum || 0},今日是否已经签到：${res?.data?.isRegister == 1 ? "✅已" : "未❌"}签到`, true)
                } else {
                    throw new Error(`接口返回：${res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }
        generateSign(data, timestamp, method = 'POST') {
            this.apiKey = 'prod_secret123@muc'
            this.hmacKey = 'PROD_VnoClJI9aikS8dyy'
            let content = '';

            if (method.toUpperCase() !== 'POST') {
                // GET请求处理
                if (typeof data === 'string') {
                    content = data;
                } else if (typeof data === 'object' && data !== null) {
                    // 按键排序后拼接
                    const keys = Object.keys(data).sort();
                    for (const key of keys) {
                        content = content + key + data[key];
                    }
                }
                content = this.apiKey + content + timestamp;
            } else {
                // POST请求处理：apiKey + JSON.stringify(data) + timestamp
                content = this.apiKey + JSON.stringify(data) + timestamp;
            }

            // 使用HMAC-SHA256生成签名
            return CryptoJS.HmacSHA256(content, this.hmacKey).toString();
        }

        async main() {
            const init = await this.init();
            if (!init) return;

            await this.sign()
            await this.base.wqwlkj.sleep(3)
            await this.info()
        }
    }

    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes);
        await base.runTasks(Task);
    } else {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
    }
})();