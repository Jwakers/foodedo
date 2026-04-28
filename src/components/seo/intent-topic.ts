export function intentPathToTopic(path: string): string {
  return path.replace(/^\//, "").replaceAll("/", "_").replaceAll("-", "_");
}
