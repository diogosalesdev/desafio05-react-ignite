import Link from 'next/link';
import styles from './header.module.scss';

interface HeaderProps {
  home?: boolean;
}

export default function Header({ home }: HeaderProps) {
  return (
    <header className={`${styles.container} ${home && styles.homeMargin}`}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
