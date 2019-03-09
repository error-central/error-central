# Point stderr to go into tee, which then sends copy to `ec`
exec 2> >(./ec 1>&2)
