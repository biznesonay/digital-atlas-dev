'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRole, getAuthSession } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const userSchema = z.object({
  email: z.string().email('Неверный формат email'),
  name: z.string().min(1, 'Имя обязательно').max(100),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional(),
  role: z.enum(['SUPER_ADMIN', 'EDITOR'])
})

export async function getUsers() {
  await requireRole('SUPER_ADMIN')
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true
    }
  })
  
  // Получаем статистику по объектам для каждого пользователя
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const objectsCount = await prisma.object.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // За последние 30 дней
          }
        }
      })
      
      return {
        ...user,
        stats: {
          recentObjects: objectsCount
        }
      }
    })
  )
  
  return usersWithStats
}

export async function getUser(id: string) {
  await requireRole('SUPER_ADMIN')
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true
    }
  })
  
  if (!user) {
    throw new Error('Пользователь не найден')
  }
  
  return user
}

export async function createUser(data: z.infer<typeof userSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = userSchema.parse(data)
  
  if (!validated.password) {
    throw new Error('Пароль обязателен при создании пользователя')
  }
  
  // Проверка на существующий email
  const existing = await prisma.user.findUnique({
    where: { email: validated.email }
  })
  
  if (existing) {
    throw new Error('Пользователь с таким email уже существует')
  }
  
  // Хэширование пароля
  const hashedPassword = await bcrypt.hash(validated.password, 10)
  
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      password: hashedPassword,
      role: validated.role,
      emailVerified: new Date() // Автоматически подтверждаем email
    }
  })
  
  revalidatePath('/admin/users')
  
  return { success: true, id: user.id }
}

export async function updateUser(id: string, data: z.infer<typeof userSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const session = await getAuthSession()
  const validated = userSchema.parse(data)
  
  // Нельзя изменить свою роль
  if (session?.user?.id === id && validated.role !== session.user.role) {
    throw new Error('Вы не можете изменить свою роль')
  }
  
  // Проверка на существующий email
  const existing = await prisma.user.findFirst({
    where: {
      email: validated.email,
      id: { not: id }
    }
  })
  
  if (existing) {
    throw new Error('Пользователь с таким email уже существует')
  }
  
  const updateData: any = {
    email: validated.email,
    name: validated.name,
    role: validated.role
  }
  
  // Обновление пароля только если он предоставлен
  if (validated.password) {
    updateData.password = await bcrypt.hash(validated.password, 10)
  }
  
  await prisma.user.update({
    where: { id },
    data: updateData
  })
  
  revalidatePath('/admin/users')
  
  return { success: true }
}

export async function deleteUser(id: string) {
  await requireRole('SUPER_ADMIN')
  
  const session = await getAuthSession()
  
  // Нельзя удалить себя
  if (session?.user?.id === id) {
    throw new Error('Вы не можете удалить свой аккаунт')
  }
  
  // Проверка, что остается хотя бы один SUPER_ADMIN
  const user = await prisma.user.findUnique({
    where: { id }
  })
  
  if (user?.role === 'SUPER_ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (adminCount <= 1) {
      throw new Error('Нельзя удалить последнего суперадминистратора')
    }
  }
  
  await prisma.user.delete({
    where: { id }
  })
  
  revalidatePath('/admin/users')
  
  return { success: true }
}

export async function resetUserPassword(id: string, newPassword: string) {
  await requireRole('SUPER_ADMIN')
  
  if (newPassword.length < 6) {
    throw new Error('Пароль должен быть не менее 6 символов')
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  })
  
  return { success: true }
}

export async function toggleUserStatus(id: string) {
  await requireRole('SUPER_ADMIN')
  
  const session = await getAuthSession()
  
  // Нельзя деактивировать себя
  if (session?.user?.id === id) {
    throw new Error('Вы не можете деактивировать свой аккаунт')
  }
  
  const user = await prisma.user.findUnique({
    where: { id }
  })
  
  if (!user) {
    throw new Error('Пользователь не найден')
  }
  
  // Переключение статуса через emailVerified
  // Если emailVerified = null, считаем пользователя деактивированным
  await prisma.user.update({
    where: { id },
    data: {
      emailVerified: user.emailVerified ? null : new Date()
    }
  })
  
  revalidatePath('/admin/users')
  
  return { success: true, isActive: !user.emailVerified }
}