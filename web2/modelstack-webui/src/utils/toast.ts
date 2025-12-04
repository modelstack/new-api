// 消息提示工具函数
import { useToast } from 'vue-toastification'

// 使用 vue-toastification 或其他 toast 库
// 如果没有安装，可以用 vuetify 的 snackbar

export function showError(message: string | Error): void {
  const msg = message instanceof Error ? message.message : message
  console.error(msg)
  // 这里可以集成 toast 通知
  alert('错误：' + msg)
}

export function showSuccess(message: string): void {
  // 这里可以集成 toast 通知
  alert(message)
}

export function showInfo(message: string): void {
  // 这里可以集成 toast 通知
  alert(message)
}

export function showWarning(message: string): void {
  // 这里可以集成 toast 通知
  alert('警告：' + message)
}
