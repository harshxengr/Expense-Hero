import Link from 'next/link'

const AppFooter = () => {
    return (
        <footer className='bg-blue-50 text-center text-sm text-gray-600 py-8 px-4 border-t'>
            © {new Date().getFullYear()} ExpenseHero. Built with ❤️ by <Link href="https://www.harshsaini.tech/" className="underline"><span className='hover:text-blue-600'>Harsh Saini</span></Link>.
        </footer>
    )
}

export default AppFooter