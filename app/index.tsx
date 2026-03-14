import { Redirect, type Href } from 'expo-router';

export default function Root() {
  return <Redirect href={'/(main)/home' as Href} />;
}
