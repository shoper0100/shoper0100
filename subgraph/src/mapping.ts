import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
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

function getOrCreateUser(userId: BigInt): User {
    let user = User.load(userId.toString())
    if (!user) {
        user = new User(userId.toString())
        user.address = BigInt.fromI32(0) as unknown as Bytes // Will be set on registration
        user.referrerId = BigInt.fromI32(0)
        user.level = 0
        user.totalIncome = ZERO_BD
        user.referralIncome = ZERO_BD
        user.sponsorIncome = ZERO_BD
        user.matrixIncome = ZERO_BD
        user.royaltyIncome = ZERO_BD
        user.registeredAt = BigInt.fromI32(0)
        user.transactionCount = 0
        user.save()
    }
    return user
}

function toBNB(amount: BigInt): BigDecimal {
    return amount.toBigDecimal().div(ONE_ETHER)
}

export function handleUserRegistered(event: UserRegistered): void {
    let user = getOrCreateUser(event.params.userId)
    user.address = event.params.account
    user.referrerId = event.params.referrer
    user.level = 1 // Starting level
    user.registeredAt = event.block.timestamp
    user.save()

    // Create registration transaction
    let txId = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let transaction = new Transaction(txId)
    transaction.txHash = event.transaction.hash
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.type = "REGISTRATION"
    transaction.user = user.id
    transaction.amount = ZERO_BD
    transaction.save()

    user.transactionCount = user.transactionCount + 1
    user.save()
}

export function handleReferralPayment(event: ReferralPayment): void {
    let user = getOrCreateUser(event.params.referrerId)
    let amount = toBNB(event.params.amount)

    user.referralIncome = user.referralIncome.plus(amount)
    user.totalIncome = user.totalIncome.plus(amount)
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

    user.transactionCount = user.transactionCount + 1
    user.save()
}

export function handleSponsorCommission(event: SponsorCommissionPaid): void {
    let user = getOrCreateUser(event.params.sponsorId)
    let amount = toBNB(event.params.amount)

    user.sponsorIncome = user.sponsorIncome.plus(amount)
    user.totalIncome = user.totalIncome.plus(amount)
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

    user.transactionCount = user.transactionCount + 1
    user.save()
}

export function handleMatrixPayment(event: MatrixPayment): void {
    let user = getOrCreateUser(event.params.toUserId)
    let amount = toBNB(event.params.amount)

    user.matrixIncome = user.matrixIncome.plus(amount)
    user.totalIncome = user.totalIncome.plus(amount)
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

    user.transactionCount = user.transactionCount + 1
    user.save()
}

export function handleUserUpgraded(event: UserUpgraded): void {
    let user = getOrCreateUser(event.params.userId)
    user.level = event.params.newLevel.toI32()
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

    user.transactionCount = user.transactionCount + 1
    user.save()
}
