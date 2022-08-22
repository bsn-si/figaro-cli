#!/bin/bash
shopt -s expand_aliases

TEST_DIR=$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)
PROJECT_DIR="$(dirname "$TEST_DIR")"

EXEC_PATH="${PROJECT_DIR}/build/index.js"
DB_DIR="${TEST_DIR}/figaro"

# Accounts
SENDER_ADDRESS=$(jq ".[0].address" ${TEST_DIR}/test_accounts.json -r)
SENDER_SECRET=$(jq ".[0].privkey" ${TEST_DIR}/test_accounts.json -r)

COURIER_ADDRESS=$(jq ".[1].address" ${TEST_DIR}/test_accounts.json -r)
COURIER_SECRET=$(jq ".[1].privkey" ${TEST_DIR}/test_accounts.json -r)

CONFIRM_CODE_PUBLIC=$(jq ".[2].pubkey" ${TEST_DIR}/test_accounts.json -r)
CONFIRM_CODE=$(jq ".[2].privkey" ${TEST_DIR}/test_accounts.json -r)

# Contract options
ROUGH_LOCATION_FROM="0.0,0.0|0.0,0.0"
ROUGH_LOCATION_TO="1.0,1.0|1.0,1.0"
EXACT_LOCATION_FROM="0.0,0.0"
EXACT_LOCATION_TO="0.0,0.0"
DEPOSIT_AMOUNT=200
PAYMENT_AMOUNT=200

if [ -f "$EXEC_PATH" ]; then
    echo "Start interaction."
else
    echo "Cli does not exist. Please build before interaction."
    echo "You can build cli with 'npm run build'"
    exit 1
fi

# Alias to cli, with tmp dir for save data
alias figaro-cli="DATA_DIR=${DB_DIR} node ${EXEC_PATH}"

# Check status args: $1 - signer secret, $2 - contract address, $3 - expected status
function assert_contract_status {
    QUERY_RES=$(figaro-cli common info \
        --secret $1 --contract $2 \
        --query status \
        --json
    )
    
    STATUS=$(echo $QUERY_RES | jq '.result' -r | jq -r)
    
    if [[ $STATUS != $3 ]]; then
        echo "Expected $3 status, but received $STATUS"
        exit 1
    fi
}

# Classic flow

# Common check balance
BALANCE_RES=$(figaro-cli common balance \
    --secret ${SENDER_SECRET} \
    --address ${COURIER_ADDRESS} \
    --json
)

echo "Check balance"
echo $BALANCE_RES

# Instantiate cw20 contract for interact with figaro
INSTANTIATE_CW20_RES=$(figaro-cli common cw20_instantiate \
    --secret ${SENDER_SECRET} \
    --initial-balances ${SENDER_ADDRESS}_1000000,${COURIER_ADDRESS}_1000000 \
    --minter ${SENDER_ADDRESS}_99900000000 \
    --decimals 6 \
    --symbol TOK \
    --name Token \
    --json
)

CW20_TOKEN_ADDRESS=$(echo $INSTANTIATE_CW20_RES | jq '.contract_address' -r)

echo "CW20 Contract instantiated"
echo $INSTANTIATE_CW20_RES

# Upload figaro contract code to blockchain
UPLOAD_CODE_RES=$(figaro-cli common upload_contract \
    --secret ${SENDER_SECRET} \
    --json
)

CODE_ID=$(echo $UPLOAD_CODE_RES | jq '.code_id' -r)

echo "Contract code was upload to node"
echo $UPLOAD_CODE_RES

# Instantiate new request
INSTANTIATE_RES=$(figaro-cli sender instantiate \
    --confirm-public ${CONFIRM_CODE_PUBLIC} \
    --location-from "${ROUGH_LOCATION_FROM}" \
    --location-to "${ROUGH_LOCATION_TO}" \
    --contract-code-id ${CODE_ID} \
    --deposit ${DEPOSIT_AMOUNT} \
    --payment ${PAYMENT_AMOUNT} \
    --token ${CW20_TOKEN_ADDRESS} \
    --secret ${SENDER_SECRET} \
    --json
)

CONTRACT_ADDRESS=$(echo $INSTANTIATE_RES | jq '.contract_address' -r)

echo "Contract was instantiated"
echo $INSTANTIATE_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "WaitPaymentBySender"

# Make payment for delivery
MAKE_PAYMENT_RES=$(figaro-cli sender make_payment \
    --contract ${CONTRACT_ADDRESS} \
    --secret ${SENDER_SECRET} \
    --json
)

echo "Sender payed for delivery"
echo $MAKE_PAYMENT_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "WaitForCourier"

# Accept request as courier
ACCEPT_REQUEST_RES=$(figaro-cli courier accept_request \
    --contract ${CONTRACT_ADDRESS} \
    --secret ${COURIER_SECRET} \
    --json
)

echo "Courier accept request"
echo $ACCEPT_REQUEST_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "WaitDepositByCourier"

# Pay deposit as courier
MAKE_DEPOSIT_RES=$(figaro-cli courier make_deposit --contract ${CONTRACT_ADDRESS} --secret ${COURIER_SECRET} --json)

echo "Courier made deposit"
echo $MAKE_DEPOSIT_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "WaitSenderDetails"

# Sender add exact locations & comment
SET_DETAILS_RES=$(figaro-cli sender set_details \
    --location-from ${EXACT_LOCATION_FROM} \
    --location-to ${EXACT_LOCATION_TO} \
    --contract ${CONTRACT_ADDRESS} \
    --secret ${SENDER_SECRET} \
    --comment Comment \
    --json
)

echo "Sender added details"
echo $SET_DETAILS_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "WaitCourierInDepartment"

# Confirm that the parcel has been issued to the courier
APPROVE_ISSUED_RES=$(figaro-cli sender approve_parcel_issued \
    --contract ${CONTRACT_ADDRESS} \
    --secret ${SENDER_SECRET} \
    --json
)

echo "The sender confirmed the delivery of the parcel"
echo $APPROVE_ISSUED_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "InProgress"

# Confirm delivery by courier and get payout
CONFIRM_DELIVERY_RES=$(figaro-cli courier confirm_delivery \
    --confirm-private ${CONFIRM_CODE} \
    --contract ${CONTRACT_ADDRESS} \
    --secret ${COURIER_SECRET} \
    --json
)

echo "Delivery completed, funds paid"
echo $CONFIRM_DELIVERY_RES

assert_contract_status $SENDER_SECRET $CONTRACT_ADDRESS "Delivered"

echo "Cleanup"
rm -rf ${DB_DIR}