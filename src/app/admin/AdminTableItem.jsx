
import { useState } from "react";
import EditUserDetails from "./EditUserDetails";

const AdminTableItem = ({
  id,
  firstName,
  LastName,
  email,
  phoneNumber,
  profit,
  totalDeposit,
  totalWithdrawal,
  transactionCode,
  className,
}) => {
  const [isEdit, setIsEdit] = useState(false);
  return (
    <>
      <tr
        onClick={() => setIsEdit(true)}
        className={`cursor-pointer hover: bg-[rgba()] ${className}`}
      >
        <td>{firstName}</td>
        <td>{LastName}</td>
        <td>{email}</td>
        <td>{phoneNumber}</td>
        <td>{profit}</td>
        <td>{totalDeposit}</td>
        <td>{totalWithdrawal}</td>
        <td>{transactionCode}</td>
      </tr>
      {isEdit && (
        <EditUserDetails
          id={id}
          firstName={firstName}
          LastName={LastName}
          email={email}
          phoneNumber={phoneNumber ? phoneNumber : "NULL"}
          profit={profit}
          totalDeposit={totalDeposit}
          totalWithdrawal={totalWithdrawal}
          transactionCode={
            transactionCode === "No Codes" ? "" : transactionCode
          }
          setIsEdit={setIsEdit}
        />
      )}
    </>
  );
};

export default AdminTableItem;
