import { BigInt, BigDecimal, Bytes } from "@graphprotocol/graph-ts"
import {
    UserRegistered,
    ReferralPayment,
    SponsorCommissionPaid,
    MatrixPayment,
    UserUpgraded
} from "../generated/FiveDollarBNB/FiveDollarBNB"
import { User, Transaction } from "../generated/schema"

const ZERO_BD = BigDecimal.fromString("0")
const ONE_ETHER = BigDecimal.fromString("1000000000000000000")

function toBNB(amount: BigInt): BigDecimal {
    return amount.toBigDecimal().div(ONE_ETHER)
}

export function handleUserRegistered(event: UserRegistered): void {
    let user = new User(event.params.userId.toString())
    user.address = event.params.account
    user.referrerId = event.params.referrer
    user.level = 1
    user.totalIncome = ZERO_BD
    user.registeredAt = event.block.timestamp
    user.transactionCount = 0
    user.save()

    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "REGISTRATION"
    transaction.user = user.id
    transaction.amount = ZERO_BD
    transaction.save()
}

export function handleReferralPayment(event: ReferralPayment): void {
    let user = User.load(event.params.referrerId.toString())
    if (!user) return

    let amount = toBNB(event.params.amount)
    user.totalIncome = user.totalIncome.plus(amount)
    user.transactionCount = user.transactionCount + 1
    user.save()

    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "REFERRAL"
    transaction.user = user.id
    transaction.amount = amount
    transaction.fromUserId = event.params.userId
    transaction.save()
}

export function handleSponsorCommission(event: SponsorCommissionPaid): void {
    let user = User.load(event.params.sponsorId.toString())
    if (!user) return

    let amount = toBNB(event.params.amount)
    user.totalIncome = user.totalIncome.plus(amount)
    user.transactionCount = user.transactionCount + 1
    user.save()

    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "SPONSOR"
    transaction.user = user.id
    transaction.amount = amount
    transaction.fromUserId = event.params.fromUserId
    transaction.level = event.params.level.toI32()
    transaction.save()
}

export function handleMatrixPayment(event: MatrixPayment): void {
    let user = User.load(event.params.toUserId.toString())
    if (!user) return

    let amount = toBNB(event.params.amount)
    user.totalIncome = user.totalIncome.plus(amount)
    user.transactionCount = user.transactionCount + 1
    user.save()

    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "MATRIX"
    transaction.user = user.id
    transaction.amount = amount
    transaction.fromUserId = event.params.fromUserId
    transaction.level = event.params.level.toI32()
    transaction.save()
}

export function handleUserUpgraded(event: UserUpgraded): void {
    let user = User.load(event.params.userId.toString())
    if (!user) return

    user.level = event.params.newLevel.toI32()
    user.transactionCount = user.transactionCount + 1
    user.save()

    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "UPGRADE"
    transaction.user = user.id
    transaction.amount = toBNB(event.params.amount)
    transaction.level = event.params.newLevel.toI32()
    transaction.save()
}
