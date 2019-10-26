# cross - 业务管理系统

## 系统安装
假设安装目录为: /home/jsmtest/apps

Clone cross：

```
git clone -b docker-deploy-test https://github.com/JSMetta/cross.git
cd cross
git pull origin dev

git clone -b vcross-1.0.1 https://github.com/JSMetta/VCross.git
cd VCross
git pull origin vcross-1.0.1

cd ..

docker-compose up --build -d

```
cross项目在/home/jsmtest/apps/cross中


## 常用命令

cd /home/jsmtest/apps/cross
git pull origin docker-deploy-test
docker build -t jsmetta/cross .
docker run -d --name redis -p 6379:6379 redis

docker run --name mongodb --restart unless-stopped -v /home/mongo/data:/data/db -v home/mongo/backups:/backups -d mongo --smallfiles

docker run -d -p 8089:8080 --link redis:redis --name cross jsmetta/cross

docker run -it --link mongodb:mongo --rm mongo mongo --host mongo test

docker run -d --name nginx -p 80:80 --link cross:cross cross/nginx

docker-compose up --build

docker exec -it mongodb mongo

#### Remove dangling images
docker images -f dangling=true
docker images purge

## 开发文档

处理消息时，如果返回：
* Promise.resolve(true) - 接收消息
* Promise.resolve(false) - 拒绝消息，重新进入消息列表
* Promise.reject(err) - 拒绝消息，消息将被废弃

### REST服务

#### PoTransactions - 采购单交易集合

采购单交易集合资源提供采购单交易查询和交易执行服务

##### 采购单交易查询服务

采购单交易查询服务实现为标准Finelets REST查询服务。
* 参数
  ** id -- 采购单标识
* 返回 -- 采购单交易资源（PoTransaction）数据集合。

## 业务规则

### 采购交易导入
采购交易可以通过CSV文件导入，格式为：
* 首行为字段名称
* 字段
  * 交易编号
  * 品名
  * 料品类型 - 低值易耗品/资产/料品（采购/委外）
  * 规格
  * 单位
  * 供应商类型 - 实体店/电商/厂家
  * 供应商名称
  * 供应商链接
  * 采购周期
  * 采购单价
  * 数量
  * 金额
  * 申请人
  * 申请日期
  * 审核人
  * 审核日期
  * 采购日期
  * 采购人
  * 到货日期
  * 领用人
  * 领用日期
  * 领用项目
  * 领用数量
  * 货位

```
交易编号,料品类型,品名,规格,单位,数量,采购单价,金额,供应商名称,供应商类型,参考单号,供应商链接,采购周期,申请人,申请日期,审核人,审核日期,采购日期,采购人,到货日期,领用人,领用日期,领用数量,领用项目,货位,备注

transNo,partType,partName,spec,unit,qty,price,amount,supplier,supply,refNo,supplyLink,purPeriod,applier,appDate,reviewer,reviewDate,purDate,purchaser,invDate,user,useDate,useQty,project,invLoc,remark

const expected = {
						transNo: 'xulei00001',
						partType: '物料',
						partName: 'JSM-A1实验用格子布',
						spec: 'abcd',
						unit: '米',
						qty: 150,
						price: 8800,
						amount: 8800,
						supplier: '绍兴惟楚纺织品有限公司',
						supply: '厂商',
						refNo: 'JSMCONV20181109A',
						supplyLink: '开票中',
						purPeriod: 80,
						applier: '徐存辉',
						appDate: new Date('2018/11/9').toJSON(),
						reviewer: '徐存辉',
						reviewDate: new Date('2018/11/9').toJSON(),
						purchaser: '徐存辉',
						purDate: new Date('2018/11/9').toJSON(),
						invDate: new Date('2018/12/12').toJSON(),
						user: '测试组',
						useDate: new Date('2018/12/12').toJSON(),
						useQty: 100,
						project: '测试组',
						invLoc: ' h234',
						remark: 'remark'
					}

```

## MQ
Consumers receive messages from a particular queue in one of two ways:
* By subscribing to it via the basic.consume AMQP command. This will place the channel being used into a receive mode until unsubscribed from the queue.
* Requesting a single message from the queue is done by using the basic.get AMQP command. This will cause the consumer to receive the next message in the queue and then not receive further messages until the next basic.get. You shouldn’t use basic.get in a loop as an alternative to
basic.consume, because it’s much more intensive on Rabbit.

When a Rabbit queue has multiple consumers, messages received by the queue are served in a round-robin fashion to the consumers.

Every message that’s received by a consumer is required to be acknowledged. Either the consumer must explicitly send an acknowledgement to RabbitMQ using the basic.ack AMQP command,
or it can set the auto_ack parameter to true when it subscribes to the queue.

If a consumer receives a message and then disconnects from Rabbit (or unsubscribes
from the queue) before acknowledging, RabbitMQ will consider the message
undelivered and redeliver it to the next subscribed consumer.

Both consumers and producers can create queues by using the queue.declare
AMQP command. But consumers can’t declare a queue while subscribed to another
one on the same channel.

Here are some other useful properties you can set for the queue:
* exclusive—When set to true, your queue becomes private and can only be
consumed by your app. This is useful when you need to limit a queue to only
one consumer.
* auto-delete—The queue is automatically deleted when the last consumer
unsubscribes. If you need a temporary queue used only by one consumer, combine
auto-delete with exclusive. When the consumer disconnects, the queue
will be removed.

With passive set to true, queue.declare will return successfully if the queue exists, and return an error without
creating the queue if it doesn’t exist.

A queue is said to be bound to an exchange by a routing key.

There are four kinds of exchanger:
* direct - if the routing key matches, then the message is delivered to the corresponding queue.
  * 利用缺省Exchange, 通过: `$channel->basic_publish($msg, '', 'queue-name');`可以向特定的队列发送消息
  * 可以实现将向多个队列发送消息
* fanout - when you send a message to a fanout
exchange, it’ll be delivered to all the queues attached to this exchange.
* topic - 可以实现将多种消息发送给多个队列
* headers