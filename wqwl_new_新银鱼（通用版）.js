/**
 * 脚本：wqwl_new_新银鱼（通用版）.js
 * 作者：wqwlkj 裙：960690899
 * 描述：小程序：壹心易购
 * 环境变量：wqwl_new_yinyu，多个换行或新建多个变量
 * 环境变量描述：抓authorization，格式authorization1#备注1
 * cron: 15 0 0,23 * * *
 */


//环境变量
const ckName = 'wqwl_new_yinyu';
//脚本名称
const scriptName = '微信小程序新银鱼质亨';
//本地版本
const version = 1.0;
//是否需要文件存储
const isNeedFile = true;

const proxy = process.env["wqwl_daili"] || '';
const isProxy = process.env["wqwl_useProxy"] || false;
const bfs = process.env["wqwl_bfs"] || 4;
const isNotify = process.env["wqwl_isNotify"] || true;
const isDebug = process.env["wqwl_isDebug"] || 2;

/**
 * 其他全局环境变量说明
 * wqwl_daili：代理链接，需要返回单挑txt格式
 * wqwl_useProxy：是否用代理，默认使用（填了代理链接）
 * wqwl_bfs：并发数，默认4
 * wqwl_isNotify：是否进行通知
 * wqwl_isDebug：是否调试输出请求
 */

//银鱼专属变量
const source_type = 2314;
const source_from = 2321;
const app_sign = 'wx4dff990a8fa3a1e7';


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




    //银鱼专属方法
    async function getVideoRoute() {
        const config = {
            method: 'get',
            url: `https://gitee.com/cobbWmy/img/raw/staticApi/data/%E9%93%B6%E9%B1%BCroute.json`
        };
        try {
            const res = await axios(config)
            let data = res.data
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (parseError) {
                    // console.log("获取远程route配置失败，使用默认配置")
                }
            }
            if (Array.isArray(data)) {
                const newItems = data.filter(item => !VIDEO_FROM_TYPES.includes(item));
                VIDEO_FROM_TYPES = VIDEO_FROM_TYPES.concat(newItems);
                console.log(`✅ 成功获取远程route配置,目前共【${VIDEO_FROM_TYPES.length}】个route`);
            }
            else {
                console.log("❌ 获取远程route配置失败，使用默认配置")
            }
        }
        catch (e) {
            console.log("❌ 获取远程route配置失败，使用默认配置")
        }
    }

    class Task extends wqwlkj.WQWLBaseTask {
        constructor(ck, index, base) {
            // 调用父类构造函数
            super(ck, index, base);
            this.baseUrl = 'https://yh.sentezhenxuan.com/api/mobile';
            this.money = 0;
        }

        async init() {
            const ckData = this.ck.split('#')
            // console.log(ckData)
            if (ckData.length < 2) {
                this.sendMessage(`${this.index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                return false;
            }
            else if (ckData.length === 1) {
                this.remark = `${ckData[0].slice(0, 8)}-${this.index}`;
            }
            else {
                this.remark = ckData[1];
            }
            this.auth = ckData[0];

            /**
            this.type = ckData[1];
              // console.log(this.auth, this.type)
                if (!/^[A-Za-z-]+$/.test(this.type)) {
                    this.sendMessage(`⚠️没传正确的Form-type，使用默认值：routine-tuangou（提现失败请手动替换）`)
                    this.type = 'routine-tuangou';
                }
                if (!VIDEO_FROM_TYPES.includes(this.type))
                    VIDEO_FROM_TYPES.unshift(this.type)
                if (!this.base.fileData[this.remark])
                    this.base.fileData[this.remark] = this.type
    
                //优先使用缓存route
                const targetValue = this.base.fileData[this.remark]
                const index = VIDEO_FROM_TYPES.indexOf(targetValue)
                if (index > -1) {
                    VIDEO_FROM_TYPES.splice(index, 1)
                }
                VIDEO_FROM_TYPES.unshift(targetValue)
    
                if (!this.auth.includes('Bearer'))
                    this.auth = `Bearer ${this.auth}`
                const jwtData = this.parseJWT(this.auth)
                if (jwtData?.payload?.iss)
                    this.baseUrl = `https://${jwtData?.payload?.iss}/api`
                else if (jwtData?.payload?.aud)
                    this.baseUrl = `https://${jwtData?.payload?.aud}/api`
                else
                    this.sendMessage(`⚠️使用ck获取host，使用默认host：n03.sentezhenxuan.com`)
             */

            this.headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                'content-type': 'application/x-www-form-urlencoded',
                "Connection": "keep-alive",
                "Referer": `https://servicewechat.com/${app_sign}/3/page-frame.html`,
                'app-sign': app_sign,
                "authorization": this.auth,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50 NetType/WIFI Language/zh_CN",
                "Cb-lang": "zh-CN",
                "xweb_xhr": "1"
            };

            if (this.base.proxyUrl && this.base.isProxy) {
                this.proxy = await this.base.wqwlkj.getProxy(this.index, this.proxyConfig)
                this.sendMessage(`✅使用代理：${this.proxy}`)
            }
            else {
                this.proxy = ''
                this.sendMessage(`⚠️不使用代理`)
            }
            return true
        }

        async getVideoIds() {
            try {
                const headers = JSON.parse(JSON.stringify(this.headers))
                const options = {
                    url: `${this.baseUrl}/video/list?source_type=${source_type}&source_from=${source_from}&source_lang=zh_CN&currency_id=&site_id=&page=1&limit=10&status=1&source=0&isXn=1`,
                    headers: headers,
                    method: 'GET',
                }

                let res = await this.request(options);
                if (res && res.status === 200 && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
                    this.sendMessage(`✅ 获取视频列表成功`)
                    this.videoIds = res.data.items
                        .filter(item => typeof item.id === 'number' && parseFloat(item.je) > 0)
                        .map(item => item.id);
                    return true;
                }
                this.sendMessage(`⚠️ 获取视频为空`)
                await wqwlkj.sleep(1)

                this.videoIds = [];
                return true;

            } catch (e) {
                this.sendMessage(`❌获取视频id请求失败，${e.message}`, true)
                this.videoIds = [];
                return false;
            }
        }

        async watchVideos() {
            if (this.videoIds.length <= 0)
                return this.sendMessage(`⚠️ 无视频可刷，跳过此步骤`)
            try {
                const header = JSON.parse(JSON.stringify(this.headers))
                header['content-type'] = 'application/json'
                const total = this.videoIds.length;
                let i = 0
                for (; i < total; i++) {
                    const options = {
                        url: `${this.baseUrl}/video/addVideoJob`,
                        headers: header,
                        method: 'POST',
                        data: JSON.stringify(
                            {
                                "source_type": source_type,
                                "source_from": source_from,
                                "source_lang": "zh_CN",
                                "currency_id": "",
                                "site_id": "",
                                vid: this.videoIds[i],
                                startTime: Date.now() - 80000,
                                endTime: Date.now(),
                                baseVersion: "3.7.12",
                                playMode: 0,
                            }
                        )
                    }
                    let res = await this.request(options);

                    if (res || res.status == 200) {
                        this.sendMessage(`🎥 视频 ${i + 1}/${total} 刷完 (ID: ${this.videoIds[i]})`, i + 1 === total);
                    } else {
                        this.sendMessage(`⚠️ 视频 ${i + 1}/${total} 异常:`, data?.msg || '无数据')
                    }
                    await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                }
                return true;
            }
            catch (e) {
                this.sendMessage(`❌ 视频观看失败:，${e.message || e}`, true)
                return false;
            }
        }

        async getMoney() {
            try {
                const options = {
                    url: `${this.baseUrl}/account/user/overview_my?source_type=${source_type}&source_from=${source_from}&source_lang=zh_CN&currency_id=&site_id=`,
                    headers: this.headers,
                    method: 'GET',
                }

                let res = await this.request(options);
                if (res?.status == 200) {
                    const money = res?.data?.user_money
                    if (money) {
                        this.sendMessage(`✅ 获取余额成功，当前余额：${money}`, true)
                        this.money = money
                    } else {
                        this.sendMessage(`❌ 获取余额失败:${res?.msg || "未知原因"}`)
                    }
                } else {
                    this.sendMessage(`❌ 获取余额失败:${res?.msg || "未知原因"}`)
                }

            }
            catch (e) {
                this.sendMessage(`❌ 获取余额请求失败:，${e.message || e}`, true)
                return false;
            }
        }

        async doWithdraw() {
            try {
                await this.getMoney()
                if (this.money < 0.1)
                    return this.sendMessage(`⚠️余额不足0.1，直接跳出提现`)
                const header = JSON.parse(JSON.stringify(this.headers))
                header['Accept-Language'] = "zh-CN,zh;q=0.9";
                header['User-Agent'] = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323d) NetType/WIFI Language/zh_CN"
                const options = {
                    url: `${this.baseUrl}/userTx`,
                    headers: header,
                    method: 'GET',
                }
                let res = await this.request(options);
                if (res.code === 200 || res.status === 200) {
                    this.sendMessage(`💰 提现发起成功，接口返回: ${res.msg || '成功'} `, true);
                } else {
                    this.sendMessage(`❌ 提现发起失败，接口返回: ${res.msg}`, true)
                }

            }
            catch (e) {
                this.sendMessage(`❌ 提现请求失败:，${e.message || e}`)
                return false;
            }
        }

        async main() {
            const init = await this.init()
            if (!init) return;
            this.sendMessage(`🔍 正在获取视频列表...`)
            const getId = await this.getVideoIds()
            if (!getId) return;
            this.sendMessage(`📽️ 获取到 ${this.videoIds.length} 个视频ID，准备刷视频...`)
            const watchVideo = await this.watchVideos()

            await this.getMoney()
            // this.sendMessage(`💳 正在尝试提现...`)
            // await this.doWithdraw()
        }

        // 手动解析 JWT（Base64 解码）
        parseJWT(token) {
            try {
                const cleanToken = token.replace('Bearer ', '');
                const parts = cleanToken.split('.');
                if (parts.length !== 3) {
                    throw new Error('无效的 JWT 格式');
                }

                const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

                return {
                    header,
                    payload,
                    signature: parts[2]
                };
            } catch (error) {
                console.error('JWT 解析失败:', error.message);
                return null;
            }
        }
    }

    //await getVideoRoute();
    if (wqwlkj.WQWLBase && wqwlkj.WQWLBaseTask) {
        const base = new wqwlkj.WQWLBase(wqwlkj, ckName, scriptName, version, isNeedFile, proxy, isProxy, bfs, isNotify, isDebug);
        await base.runTasks(Task);
    }
    else {
        // 如果 wqwl_require.js 没有导出 WQWLBase，可能需要手动处理
        console.log('❌ wqwl_require.js 未发现WQWLBase类、WQWLBaseTask类，请重新下载新版本');
        console.log('地址：' + url);
    }
})();