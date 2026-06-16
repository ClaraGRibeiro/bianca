
export const sortCollections = (data: any[], ascending: boolean) => {
  return [...data].sort((a, b) => {
    const [diaA, mesA, anoA] = a.data.split("/");
    const [horaA, minutoA] = a.hora.split(":");

    const [diaB, mesB, anoB] = b.data.split("/");
    const [horaB, minutoB] = b.hora.split(":");

    const dateA = new Date(
      Number(anoA),
      Number(mesA) - 1,
      Number(diaA),
      Number(horaA),
      Number(minutoA)
    );

    const dateB = new Date(
      Number(anoB),
      Number(mesB) - 1,
      Number(diaB),
      Number(horaB),
      Number(minutoB)
    );

    return ascending
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });
};