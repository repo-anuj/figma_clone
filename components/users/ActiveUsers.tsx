import { useOthers, useSelf } from "@/liveblocks.config";
import { userAgent } from "next/server";
import { Avatar } from "./Avatar";
import styles from "./Avatar.module.css";
import { generateRandomName } from "@/lib/utils";

const ActiveUsers = () => {
  const users = useOthers();
  const currentUser = useSelf();
  const hasMoreUsers = users.length > 3;
  const others = useOthers();

  return(
    <main className="flex h-screen w-full select-none place-content place-items-center">
      <div className="flex pl-3">

      {currentUser && ( 
            <Avatar name="you" otherStyles="border-[3px] border-primary-green" />
        )}
        {users.slice(0, 3).map(({ connectionId, info }) => {
          return (
            <Avatar key={connectionId} name={generateRandomName()} otherStyles="-ml-3" />
          );
        })}
        {hasMoreUsers && (
          <div className='z-10 -ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-black'>
            +{others.length - 2}
          </div>)}
      </div>
    </main>
  )
}
export default ActiveUsers;