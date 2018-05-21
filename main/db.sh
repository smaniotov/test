echo "Deleting database..."
aws --endpoint-url http://localhost:8000 dynamodb delete-table --table-name mx-postalcode
echo "Creating database..."
aws --endpoint-url http://localhost:8000 dynamodb create-table --table-name mx-postalcode --attribute-definitions AttributeName=code,AttributeType=S --key-schema AttributeName=code,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5