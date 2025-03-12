export default (text: string | number): string => {
  return text.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
