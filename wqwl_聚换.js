/**
 * 脚本：wqwl_聚换.js
 * 作者：wqwlkj 裙：960690899
 * 描述：微信小程序聚换旧衣服回收
 * 环境变量：wqwl_juhuan，多个换行或新建多个变量
 * 环境变量描述：抓包Headers下的authorization，格式例如：authorization#备注1（authorization去掉Bearer ）
 * 代理变量：wqwl_daili（获取代理链接，需要返回txt格式的http/https）
 * cron: 0 3 * * * 一天一次即可
 */


const axios = require('axios');
const fs = require('fs');

//代理链接
let proxy = process.env["wqwl_daili"] || '';

//是否用代理，默认使用（填了代理链接）
let isProxy = process.env["wqwl_useProxy"] || true;

//并发数，默认3
let bfs = process.env["wqwl_bfs"] || 3;

// 是否通知
let isNotify = true;

//账号索引
let index = 0;

//ck环境变量名
const ckName = 'wqwl_juhuan';

//脚本名称
const name = '微信小程序聚换旧衣服回收'

!(async function () {
    let wqwlkj;

    const filePath = 'wqwl_require.js';
    const url = 'https://raw.githubusercontent.com/298582245/wqwl_qinglong/refs/heads/main/wqwl_require.js';

    if (fs.existsSync(filePath)) {
        console.log('✅wqwl_require.js已存在，无需重新下载，如有报错请重新下载覆盖\n');
        wqwlkj = require('./wqwl_require');
    } else {
        console.log('正在下载wqwl_require.js，请稍等...\n');
        console.log(`如果下载过慢，可以手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本`)
        console.log('地址：' + url);
        try {
            const res = await axios.get(url);
            fs.writeFileSync(filePath, res.data);
            console.log('✅下载完成，准备开始运行脚本\n');
            wqwlkj = require('./wqwl_require');
        } catch (e) {
            console.log('❌下载失败，请手动下载wqwl_require.js，并保存为wqwl_require.js，并重新运行脚本\n');
            console.log('地址：' + url);
            return; // 下载失败，不再继续执行
        }
    }

    // 确保 require 成功后才继续执行
    try {
        wqwlkj.disclaimer();

        let notify;
        if (isNotify) {
            try {
                notify = require('./sendNotify');
                console.log('✅加载发送通知模块成功');
            } catch (e) {
                console.log('❌加载发送通知模块失败');
                notify = null
            }
        }


        class Task {
            constructor(ck) {
                this.index = index++;
                this.baseURL = 'https://shop.jhzh66.com/api'
                this.ck = ck
            }

            async init(ck) {
                const ckData = ck.split('#')
                if (ckData.length < 1) {
                    return this.sendMessage(`${index + 1} 环境变量有误，请检查环境变量是否正确`, true);
                }
                else if (ckData.length === 1) {
                    this.remark = ckData[0].slice(0, 8);
                }
                else {
                    this.remark = ckData[1];
                }
                this.auth = ckData[0];
                this.headers = {
                    "accept": "*/*",
                    "accept-language": "zh-CN,zh;q=0.9",
                    "authorization": this.auth,
                    "content-type": "application/json",
                    "oppl": "RECXCX",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "xweb_xhr": "1",
                    "Referer": "https://servicewechat.com/wx917f69122a336cf5/157/page-frame.html",
                    "Referrer-Policy": "unsafe-url"
                }
                if (proxy && isProxy) {
                    this.proxy = await wqwlkj.getProxy(this.index, proxy)
                    //console.log(`使用代理：${this.proxy}`)
                    this.sendMessage(`✅使用代理：${this.proxy}`)
                }
                else {
                    this.proxy = ''
                    this.sendMessage(`⚠️不使用代理`)
                }
            }

            //广告开始
            async adStart(data) {
                try {
                    data = data || {}
                    const options = {
                        url: `${this.baseURL}/rec.video/adv_start`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify(data)
                    }
                    //console.log(data)
                    const response = await wqwlkj.request(options)
                    //console.log(JSON.stringify(response))
                    if (response.code == 200) {
                        const member_id = response.data.member_id
                        const rv_id = response.data.rv_id
                        if (response.data.watch_count === 1)
                            return this.sendMessage(`❌本次广告今日已经观看过`)
                        if (member_id && rv_id) {
                            this.sendMessage(`✅获取到广告id：${member_id}`)
                            return { member_id, rv_id }
                        }
                        else {
                            return this.sendMessage(`❌获取广告数据失败，${response.msg}`)
                        }
                    }
                    else {
                        return this.sendMessage(`❌观看广告失败，${response.msg}`)
                    }
                }
                catch (e) {
                    throw new Error(`❌请求广告接口失败，${e.message}`)
                }
            }

            async adEnd(member_id, rv_id, type) {
                try {
                    const obj = {
                        rv_id: rv_id,
                        member_id: member_id,
                        end_time: Date.now() / 1e3
                    }
                    let token = this.getToken(obj)
                    obj.token = token
                    obj.type = type || 1
                    const options = {
                        url: `${this.baseURL}/rec.video/adv_end`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify(obj)
                    }
                    const response = await wqwlkj.request(options)
                    if (typeof response === 'string') {
                        // 如果是错误消息，检查是否包含500错误
                        if (response.includes('500') || response.includes('Internal Server Error')) {
                            return this.sendMessage(`❌结束广告可能今天已经看过了`);
                        }
                    }
                    // console.log(JSON.stringify(response))
                    if (response.code == 200) {
                        if (response?.data?.adv_detail?.money && response?.data?.adv_detail?.credit3)
                            this.sendMessage(`✅本次观看广告成功，获得${response?.data?.adv_detail?.money}元，积分+${response?.data?.adv_detail?.credit3}`)
                        else
                            this.sendMessage(`❌接口返回：${JSON.stringify(response.data)}`)
                    }
                    else {
                        return this.sendMessage(`❌结束广告失败，${response.msg}`)
                    }
                }
                catch (e) {
                    throw new Error(`❌结束广告接口失败，${e.message}`)
                }
            }

            async signCheck() {
                try {

                    const options = {
                        url: `${this.baseURL}/adv.signin/signin_check`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify({})
                    }
                    const response = await wqwlkj.request(options)
                    // console.log(JSON.stringify(response))
                    if (response.code == 200) {
                        if (response.data.signin_check)
                            return this.sendMessage(`⚠️今日已签到`, true)
                        else
                            await this.sign()
                    }
                    else {
                        return this.sendMessage(`❌检查签到失败，${response.msg}`)
                    }
                }
                catch (e) {
                    throw new Error(`❌请求检查签到接口失败，${e.message}`)
                }
            }

            async sign() {
                try {

                    const options = {
                        url: `${this.baseURL}/adv.signin/signin_add`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify({})
                    }
                    const response = await wqwlkj.request(options)
                    // console.log(JSON.stringify(response))
                    if (response.code == 200) {
                        return this.sendMessage(`✅签到成功`, true)
                    }
                    else {
                        return this.sendMessage(`❌签到失败，${response.msg}`)
                    }
                }
                catch (e) {
                    throw new Error(`❌请求签到接口失败，${e.message}`)
                }
            }

            async info() {
                try {

                    const options = {
                        url: `${this.baseURL}/member/member_info`,
                        method: 'POST',
                        headers: this.headers,
                        data: JSON.stringify({})
                    }
                    const response = await wqwlkj.request(options)
                    // console.log(JSON.stringify(response))
                    if (response.code == 200) {
                        const id = response.data.id
                        const credit = response.data.credit3
                        const red_pack = response.data.red_pack
                        if (id && credit && red_pack) {
                            return this.sendMessage(`👤 用户【${id}】：积分：${credit}，红包：${red_pack}`, true)
                        }
                        else {
                            return this.sendMessage(`❌获取用户信息失败，${response.msg}`)
                        }
                    }
                    else {
                        return this.sendMessage(`❌获取用户信息失败，${response.msg}`)
                    }
                }
                catch (e) {
                    throw new Error(`❌请求获取用户信息接口失败，${e.message}`)
                }
            }

            async main() {
                await this.init(this.ck)
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                this.sendMessage(`开始执行签到`)
                await this.signCheck()
                await wqwlkj.sleep(wqwlkj.getRandom(3, 5))
                this.sendMessage(`开始执行观看广告`)
                for (let i = 0; i < 3; i++) {
                    this.sendMessage(`🔁正在获取第${i + 1}个广告...`)
                    let data
                    if (i !== 0)
                        data = await this.adStart({ type: i + 1 })
                    else
                        data = await this.adStart()
                    const { member_id, rv_id } = data || {}
                    if (member_id && rv_id) {
                        const sleep = wqwlkj.getRandom(30, 40)
                        this.sendMessage(`⏳正在模拟观看广告，请稍等${sleep}秒...`)
                        await wqwlkj.sleep(sleep)
                        await this.adEnd(member_id, rv_id, i + 1)
                    }
                    await wqwlkj.sleep(wqwlkj.getRandom(3, 5))

                }
                await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
                await this.info()
            }

            getToken(obj) {
                const { member_id, rv_id, end_time } = obj
                const str = `end_time=${end_time}&key=hdjfw24hjw28d033bzaad0i&member_id=${member_id}&rv_id=${rv_id}`
                return wqwlkj.sha1(str)
            }

            sendMessage(message, isPush = false) {
                message = `账号[${this.index + 1}](${this.remark}): ${message}`
                if (isNotify && isPush) {
                    return wqwlkj.sendMessage(message + "\n")
                }
                console.log(message)
                return message
            }

        }

        console.log(`${name}开始执行...`);
        const tokens = wqwlkj.checkEnv(process.env[ckName]);
        console.log(`共${tokens.length}个账号`);
        const totalBatches = Math.ceil(tokens.length / bfs);
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * bfs;
            const end = start + bfs;
            const batch = tokens.slice(start, end);

            console.log(`开始执行第 ${batchIndex + 1} 批任务 (${start + 1}-${Math.min(end, tokens.length)})`);

            const tasks = batch.map(token => new Task(token).main());
            await Promise.all(tasks);
            await wqwlkj.sleep(wqwlkj.getRandom(1, 3))
        }
        console.log(`${name}全部任务已完成！`);

        const message = wqwlkj.getMessage()
        if (message !== '' && isNotify === true) {
            await notify.sendNotify(`${name} `, `${message} `);
        }

    } catch (e) {
        console.error('❌ 执行过程中发生异常:', e.message);
    }

})();