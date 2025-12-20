/**
 * 脚本：wqwl_new_书亦烧仙草免单.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序书亦烧仙草，抓包请求头的auth，格式：auth#备注（备注可选）
 * 环境变量：wqwl_sysxc，多个换行或新建多个变量（不能混合使用）
 * 环境变量：sysxc_answer，备选答案，防止自动获取失败
 * 环境变量：sysxc_cron，定时点，默认9:30:00
 * 环境变量描述：
 * cron: 25 9 * * *
 */

//2025-12-17至2025-12-20免单

//独立变量
const CRON_TIME = process.env["sysxc_cron"] || '9:30:00'//定时点
const RIGHT_ANSWER = process.env["sysxc_answer"];//答案，目前不知道对不对
const DO_TIMES = 100;//请求抢券次数

//环境变量
const ckName = 'wqwl_sysxc';
//脚本名称
const scriptName = '微信小程序书亦烧仙草免单';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 1;
//日志是否需要具体时间
const isNeedTimes = true;
//日志是否需要推送汇总
const isNeedDetailed = true;

const oneProxy = process.env["wqwl_1mindaili"] || '';//使用代理请用这个

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
            this.baseUrl = 'https://yzfmall-front-api.huabokeji.com';

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

            this.token = ckData[0];


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
                'User-Agent': ua,
                'Content-Type': 'application/json',
                'auth': this.token,
                'sessionkey': '',
                'releaseVersion': '20251211',
                'httpt-taceId': '',
                'hostName': 'scrm-prod.shuyi.org.cn',
                'Terminal-Code': 'member_wechat_micro',
                'channel': 'wechat_micro',
                'channelId': '',
                'charset': 'utf-8',
                'Referer': 'https://servicewechat.com/wxa778c3d895442625/562/page-frame.html',
            }


            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig);
                this.sendMessage(`✅ 使用代理：${this.proxy}`);
            } else {
                this.proxy = '';
            }

            return true;
        }



        // 尝试获取答案
        async baseinfo() {
            const methodName = '自动获取答案';

            this.sendMessage(`🔍 正在${methodName}...`);
            const method = async () => {
                const options = {
                    url: `https://static-shuyi-scrm.shuyi.org.cn/yunxi/activity/kouling20251217/baseinfo.json`,
                    headers: {
                        'User-Agent': this.headers['User-Agent'],
                        'content-type': 'application/json',
                        'charset': 'utf-8',
                        'referer': 'https://servicewechat.com/wxa778c3d895442625/562/page-frame.html'
                    },
                    method: "GET",
                };

                const res = await this.request(options, 0);
                if (res.stageList[0].ext.password[0].answer) {
                    this.answer = res.stageList[0].ext.password[0].answer
                    this.sendMessage(`✅ [${methodName}] 成功，答案：${this.answer}`)
                    return true
                } else {
                    this.answer = RIGHT_ANSWER
                    this.sendMessage(`使用环境变量答案：${answer}`)
                    throw new Error(`接口返回：${res?.errorMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        // 抢券
        async draw() {
            const methodName = '抢券';

            this.sendMessage(`💾 正在${methodName}...`);
            const method = async () => {
                const options = {
                    url: `https://mkscrm-prod.shuyi.org.cn/saas-gateway/api/agg-trade/v1/activity/game/draw/draw`,
                    headers: this.headers,
                    method: "POST",
                    data: {
                        "activityCode": `kouling20251217`,
                        "inputValue": this.answer
                    }
                };

                const res = await this.request(options, 0);
                if (res?.resultCode === "0") {
                    this.statisticSetSuccess(methodName);
                    this.sendMessage(`✅ [${methodName}] 成功，获得${res?.data[0]?.activityItemName || '未知奖品'}`, true)
                    return true;
                } else {
                    this.statisticSetFailure(methodName);
                    throw new Error(`接口返回：${res?.resultMsg || res?.msg || "未知错误信息"}`)
                }

            };

            return await this.safeExecute(method, methodName);
        }

        async request(options, times = 0) {
            let proxy = ''
            if (oneProxy) {
                proxy = await this.base.wqwlkj.getProxy(this.index, oneProxy)
            }

            try {
                const data = await this.base.wqwlkj.request(options, proxy);
                return data;
            } catch (e) {
                this.sendMessage(`请求异常，这个没事，直接继续执行,`)
                return false;
            }
        }


        getDate() {
            const date = new Date()
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        }
        async main() {
            const init = await this.init();
            if (!init) return;

            await this.baseinfo()
            await this.base.wqwlkj.sleep(1)
            await this.scheduleExecute(
                this.draw.bind(this),  // 要执行的函数
                CRON_TIME,                 // 目标时间
                true,
                DO_TIMES,                          // 执行3次
                500
            );
        }
    }

    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes, isNeedDetailed);
        await base.runTasks(Task);
    } else {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
    }
})();