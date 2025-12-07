/**
 * 脚本：wqwl_new_林痣晴Min.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序林痣晴Min，Authorization格式：Authorization1#备注1
 * 环境变量：wqwl_lzqmin，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 2 8 * * *
 */

//ck2天

//环境变量
const ckName = 'wqwl_lzqmin';
//脚本名称
const scriptName = '微信小程序林痣晴Min';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 1;
//日志是否需要具体时间
const isNeedTimes = false;


const WXAppId = 'wxd1897f7877a30edc'
const appVersion = '2.18.5'

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
            this.baseUrl = 'https://smp-api.iyouke.com/';

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

            this.auth = ckData[0];

            if (!this.base.fileData[this.remark])
                this.base.fileData[this.remark] = {}
            let ua;
            if (!this.base.fileData[this.remark]['ua']) {
                this.base.fileData[this.remark]['ua'] = this.base.wqwlkj.generateRandomUA()
            }
            ua = this.base.fileData[this.remark]['ua']

            this.sendMessage(`🎲 使用ua：${ua.slice(0, 60)}`)
            // 设置请求头
            this.headers = {
                Connection: 'keep-alive',
                'User-Agent': ua,
                Authorization: this.auth,
                xweb_xhr: 1,
                appId: WXAppId,
                'xy-extra-data': `appid=${WXAppId};version=${appVersion};envVersion=release;senceId=1005`,
                envVersion: 'release',
                version: appVersion,
                Accept: '*/*',
                Referer: `https://servicewechat.com/${WXAppId}/91/page-frame.html`,
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Accept-Encoding': 'gzip, deflate'

            }

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

            const date = this.getFormattedDate()
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/dtapi/pointsSign/user/sign?date=${date}`,
                    headers: this.headers,
                    method: "GET",
                };

                const res = await this.request(options, 0);
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，获得积分：${res?.data?.extraSignReward + res?.data?.signReward || 0}`, true)
                } else {
                    throw new Error(`接口返回：${res?.errorMsg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }
        async info() {
            const methodName = '个人信息';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/dtapi/points/user/centerInfo`,
                    method: "GET",
                    headers: this.headers,
                };

                const res = await this.request(options, 0);
                if (res?.success) {
                    this.sendMessage(`✅ [${methodName}] 成功，当前积分：${res?.data?.pointsBalance}`, true)
                } else {
                    throw new Error(`接口返回：${res?.errorMsg || "未知错误信息"}`)
                }
            };

            return await this.safeExecute(method, methodName);
        }

        getFormattedDate() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始
            const day = String(now.getDate()).padStart(2, '0');

            return `${year}/${month}/${day}`;
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