echo "Deleting zipcode database..."
aws --endpoint-url http://localhost:8000 dynamodb delete-table --table-name mx-postalcode
echo "Deleting lastUpdate database..."
aws --endpoint-url http://localhost:8000 dynamodb delete-table --table-name mx-zip-lastupdate
echo "Creating zipcode database..."
aws --endpoint-url http://localhost:8000 dynamodb create-table --table-name mx-postalcode --attribute-definitions AttributeName=code,AttributeType=S --key-schema AttributeName=code,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
echo "Creating lastUpdate database..."
aws --endpoint-url http://localhost:8000 dynamodb create-table --table-name mx-zip-lastupdate --attribute-definitions AttributeName=updatedAt,AttributeType=S --key-schema AttributeName=updatedAt,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 
