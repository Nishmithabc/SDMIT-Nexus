import bcrypt

password = "Nishbc2005".encode("utf-8")
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())  # this is what you insert into PostgreSQL
