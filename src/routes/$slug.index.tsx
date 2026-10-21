import {createFileRoute} from "@tanstack/react-router";
import Home from "@/views/public/Home";
import {useData} from "@/contexts/DataContext";
function Shop(){const {tenant}=useData();return tenant?<Home/>:<main className="saas-page"><h1>Barbearia não encontrada ou indisponível.</h1><a href="/">Voltar</a></main>;}
export const Route=createFileRoute("/$slug/")({component:Shop});
