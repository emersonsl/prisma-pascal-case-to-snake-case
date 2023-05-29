### This script maps models and enumerations from Prisma Schema Language (PSL) files. Transforming tables and fields of database from camel case (pascal case) to snake case.

#### Sample input:

```
enum OPTION {
  YES
  NO
}

model People {
  idPeople        Int    @id
  nameAndLastName String
  phone           String
}
```

#### Sample output: 

```
enum OPTION {
  YES @map("yes")
  NO  @map("no")

  @@map("option")
}

model People {
  idPeople        Int    @id @map("id_people")
  nameAndLastName String @map("name_and_last_name")
  phone           String @map("phone")

  @@map("people")
}
```


### Technology

* TypeScript