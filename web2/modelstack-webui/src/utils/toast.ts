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
