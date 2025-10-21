-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "assignedCourierId" TEXT;

-- CreateTable
CREATE TABLE "_AssignedCourierOrders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignedCourierOrders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssignedCourierOrders_B_index" ON "_AssignedCourierOrders"("B");

-- AddForeignKey
ALTER TABLE "_AssignedCourierOrders" ADD CONSTRAINT "_AssignedCourierOrders_A_fkey" FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignedCourierOrders" ADD CONSTRAINT "_AssignedCourierOrders_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
