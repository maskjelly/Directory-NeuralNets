'use server'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function onSubmit(Title: string, Description: string, Link: string) {
  try {
    await prisma.resource.create({
      data: {
        Title,
        Description,
        Link,
      },
    });
    return { success: true, message: "Data added successfully!" };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, message: "Failed to add data." };
  }
}

export async function getData() {
  try {
    const resources = await prisma.resource.findMany();
    return { success: true, data: resources };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { success: false, data: [] };
  }
}