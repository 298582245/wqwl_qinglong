/**
 * 脚本：wqwl_new_绿动新球.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序绿动新球，抓包请求参数token，格式：token#备注（备注可选）
 * 环境变量：wqwl_ldxq，多个换行或新建多个变量（不能混合使用）
 * 环境变量描述：
 * cron: 0 8 * * *
 */

//本人提不了了，不知道是不是号黑了，你们可以试试看。

//环境变量
const ckName = 'wqwl_ldxq';
//脚本名称
const scriptName = '微信小程序绿动新球';
//本地版本
const version = 1.1;
//是否需要文件存储
const isNeedFile = true;
//ck长度
const ckLength = 1;
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
            this.baseUrl = 'https://lvdong.fzjingzhou.com/api';
            this.taskConfig = {
                minWithdrawScore: 3 // 最小提现环保豆数量
            };
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
                Connection: 'keep-alive',
                'xweb_xhr': '1',
                'User-Agent': ua,
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: '*/*',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                Referer: 'https://servicewechat.com/wxa61a45f180dec800/4/page-frame.html',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                platform: 'MP-WEIXIN'
            };

            if (this.proxyConfig && this.isProxy) {
                this.proxy = await wqwlkj.getProxy(this.index, this.proxyConfig);
                this.sendMessage(`✅ 使用代理：${this.proxy}`);
            } else {
                this.proxy = '';
            }

            return true;
        }

        // 获取用户信息
        async getUserInfo() {
            const methodName = '获取用户信息';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/Person/index`,
                    method: "POST",
                    data: qs.stringify({
                        token: this.token
                    })
                };

                const res = await this.request(options, 0);

                if ((res?.code === 1 || res?.code === 1000 || res?.msg === 'success') && res?.data) {
                    const nickname = res.data?.nickname || res.data?.name || '未知用户';
                    this.userInfo = res.data;
                    this.sendMessage(`✅ [${methodName}] 成功，用户：${nickname}`);
                    return res.data;
                } else if (res?.success === true || res?.status === 'success') {
                    this.userInfo = res.data || res;
                    this.sendMessage(`✅ [${methodName}] 成功`);
                    return res.data || { valid: true };
                } else {
                    const message = res?.msg || res?.message || JSON.stringify(res);
                    if (message === 'success') {
                        return { valid: true };
                    } else {
                        throw new Error(`接口返回：${message}`);
                    }
                }
            };

            return await this.safeExecute(method, methodName);
        }

        // 查询环保豆数量
        async getScore() {
            const methodName = '查询环保豆';
            const method = async () => {
                const userInfo = await this.getUserInfo();
                if (userInfo && userInfo.score !== undefined) {
                    const score = userInfo.score;
                    this.sendMessage(`✅ [${methodName}] 成功，当前环保豆：${score}`, true);
                    return score;
                } else {
                    throw new Error('无法获取环保豆数量');
                }
            };

            return await this.safeExecute(method, methodName);
        }

        // 签到
        async checkin() {
            const methodName = '签到';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/Person/sign`,
                    method: "POST",
                    data: qs.stringify({
                        token: this.token
                    })
                };

                const res = await this.request(options, 0);

                if (res?.code === 1 || res?.code === 1000 || res?.success === true || res?.status === 'success') {
                    const message = res?.msg || res?.message || '签到成功';
                    this.sendMessage(`✅ [${methodName}] 成功：${message}`, true);
                    return { success: true, message };
                } else if (res?.code === 1001 || (res?.msg && res.msg.includes('已签到'))) {
                    const message = res?.msg || res?.message || '今日已签到';
                    this.sendMessage(`✅ [${methodName}] 今日已签到`, true);
                    return { success: true, message, isAlreadySigned: true };
                } else {
                    const message = res?.msg || res?.message || '签到失败';
                    throw new Error(`接口返回：${message}`);
                }
            };

            return await this.safeExecute(method, methodName);
        }

        // 提现
        async withdraw(score) {
            const methodName = '提现';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/cash/scoreWithdraw`,
                    method: "POST",
                    data: qs.stringify({
                        type: 'wx_account',
                        score: score,
                        token: this.token
                    })
                };

                const res = await this.request(options, 0);

                if (res?.code === 1 || res?.code === 1000 || res?.success === true || res?.status === 'success') {
                    const message = res?.msg || res?.message || `提现 ${score} 环保豆成功`;
                    this.sendMessage(`✅ [${methodName}] 成功：${message}`, true);
                    return { success: true, message };
                } else {
                    const message = res?.msg || res?.message || '提现失败';
                    throw new Error(`接口返回：${message}`);
                }
            };

            return await this.safeExecute(method, methodName);
        }

        // 初始化请求
        async initRequest() {
            const methodName = '初始化';
            const method = async () => {
                const options = {
                    url: `${this.baseUrl}/common/init`,
                    method: "POST",
                    data: qs.stringify({
                        token: this.token
                    })
                };

                const res = await this.request(options, 0);
                this.sendMessage(`✅ [${methodName}] 成功`, false);
                return res;
            };

            return await this.safeExecute(method, methodName);
        }

        async main() {
            const init = await this.init();
            if (!init) return;

            try {
                // 初始化请求
                await this.initRequest();
                await wqwlkj.sleep(2);

                // 获取用户信息
                const isSuccess = await this.getUserInfo();
                if (!isSuccess) return;
                await wqwlkj.sleep(2);

                // 执行签到
                await this.checkin();
                await wqwlkj.sleep(3);

                // 查询环保豆数量
                const score = await this.getScore();

                // 检查并执行提现
                if (score !== undefined && score >= this.taskConfig.minWithdrawScore) {
                    this.sendMessage(`🎉 环保豆数量 ${score} >= ${this.taskConfig.minWithdrawScore}，尝试提现...`, false);
                    await wqwlkj.sleep(2);
                    await this.withdraw(score);
                } else if (score !== undefined) {
                    this.sendMessage(`⚠️ 环保豆数量 ${score} < ${this.taskConfig.minWithdrawScore}，跳过提现`, false);
                }

            } catch (error) {
                this.sendMessage(`❌ 任务执行失败: ${error.message}`, true);
            }
        }
    }

    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug, isNeedTimes);
        await base.runTasks(Task);
    } else {
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
    }
})();