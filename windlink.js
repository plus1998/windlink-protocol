
const crypto = require('crypto');
const Axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const mqtt = require('mqtt');

const host = 'dfappnewgw-pro.pateo.com.cn';
const baseUrl = 'https://' + host;
const projectKey = 'f1f07ed28cf141e79809c07a91647f42';

const createDeviceId = () => {
    return crypto.createHash('md5').update(Date.now().toString()).digest('hex').toUpperCase();
}

const createSign = (loginId, password, deviceId, timestamp) => {
    const str = "" + loginId + password + "1" + deviceId + "0" + timestamp + projectKey;
    const md5 = crypto.createHash('sha256').update(str).digest('hex');
    return md5
}


// 登录
const login = async (loginId, password) => {
    const ts = new Date().valueOf();
    const deviceId = createDeviceId();
    const sign = createSign(loginId, password, deviceId, ts);
    const axios = Axios.create({
        headers: {
            Accept: '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'x37/1 CFNetwork/1333.0.4 Darwin/21.5.0',
            host,
        },
    });
    const body = {
        loginId,
        password,
        loginType: 1,
        deviceId,
        ts,
        sign,
        deviceType: 0
    };
    const query = qs.stringify(body);
    try {
        const { status, data } = await axios.post(baseUrl + '/auth/userLogin?' + query);
        console.log(status, data);
        fs.appendFileSync('./log', `request: ${query} response: ${JSON.stringify(data)}`)
        return data;
    } catch (error) {
        const data = error.response ? error.response.data : error.message;
        fs.appendFileSync('./log', `request: ${query} response: ${JSON.stringify(data)}\n`)
        return data;
    }
}

// mqtt
const mqttConnect = async (vin) => {
    const client = mqtt.connect('wss://dfemq-pro.pateo.com.cn/mqtt', {
        username: 'dfgroup',
        password: '7wDyMv0V',
        clientId: vin
    })
    // clientId = n.carInfo.defaultCar.vin LGJE1EE07KM774568
    client.on('connect', function () {
        console.log(vin, '连接到mqtt')
        client.subscribe(vin + '/IVI/TSP', error => {
            if (error) {
                console.error(error)
                return
            }
            // 订阅成功
            console.log(vin, 'topic订阅成功')
        })
    })
    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(topic, JSON.parse(message.toString()))
        // TODO 请求到回调地址
    })
    client.on('error', console.error)
}

module.exports = { login, mqttConnect };