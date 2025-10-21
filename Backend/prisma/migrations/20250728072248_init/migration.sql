/*
  Warnings:

  - You are about to drop the `_AssignedCourierOrders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AssignedCourierOrders" DROP CONSTRAINT "_AssignedCourierOrders_A_fkey";

-- DropForeignKey
ALTER TABLE "_AssignedCourierOrders" DROP CONSTRAINT "_AssignedCourierOrders_B_fkey";

-- DropTable
DROP TABLE "_AssignedCourierOrders";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedCourierId_fkey" FOREIGN KEY ("assignedCourierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
