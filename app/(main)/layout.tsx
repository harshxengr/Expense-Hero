import { ReactNode } from "react"

interface MainLayoutProps {
    children: ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="container mx-auto my-32">
            {children}
        </div>
    )
}

export default MainLayout