// Ajouter à prisma/schema.prisma dans le fichier

model ImportBatch {
  id        Int       @id @default(autoincrement())
  courseId  Int
  course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  status    String    @default("IN_PROGRESS")
  
  chaptersStatus    String    @default("PENDING")
  pretestStatus     String    @default("PENDING")
  formativeStatus   String    @default("PENDING")
  summativeStatus   String    @default("PENDING")
  
  chaptersError     String?
  pretestError      String?
  formativeError    String?
  summativeError    String?
  
  chaptersCreated   Int       @default(0)
  pretestCreated    Int       @default(0)
  formativeCreated  Int       @default(0)
  summativeCreated  Int       @default(0)
  
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Ajouter aussi cette relation dans le modèle Course:
model Course {
  // ... autres champs existants ...
  importBatches   ImportBatch[]
}
