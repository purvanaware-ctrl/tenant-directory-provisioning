import json
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

with open("seed.json", encoding="utf-8") as f:
    data = json.load(f)

connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT", 3306)),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)

cursor = connection.cursor()

sql = """
INSERT IGNORE INTO organizations
(source_id, tenant_source_id, name, org_type, status, details)
VALUES (%s, %s, %s, %s, %s, %s)
"""

inserted = 0

for org in data["organizations"]:
    cursor.execute(sql, (
        org["id"],
        org["tenantId"],
        org["name"],
        org["organizationType"],
        org["lifecycleStatus"],
        json.dumps(org)
    ))
    inserted += cursor.rowcount

connection.commit()

cursor.execute("SELECT COUNT(*) FROM organizations")
print("Original organizations:", len(data["organizations"]))
print("New records inserted:", inserted)
print("Total organizations:", cursor.fetchone()[0])

cursor.close()
connection.close()